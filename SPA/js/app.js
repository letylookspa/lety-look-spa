/**
 * LETY LOOK SPA - Application Logic & Controllers
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current application state
    const state = {
        currentView: 'dashboard',
        selectedAgendaDate: getTodayString(),
        agendaStaffFilter: 'all',
        appointmentsSearch: '',
        appointmentsStatusFilter: 'all',
        appointmentsCategoryFilter: 'all',
        selectedServiceCategory: 'all'
    };

    // Helper Functions
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    }

    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateDisplay(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatTime12h(time24) {
        if (!time24) return '';
        const [hourStr, minStr] = time24.split(':');
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12; // 0 becomes 12
        return `${hour}:${minStr} ${ampm}`;
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-circle-check';
        if (type === 'error') icon = 'fa-circle-exclamation';
        if (type === 'info') icon = 'fa-circle-info';

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Modal Helpers
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Setup Modal Close Handlers
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Real-time Clock
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const clockEl = document.getElementById('live-time-display');
        if (clockEl) clockEl.textContent = timeStr;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Topbar Sync / Cache Refresh
    document.getElementById('topbar-sync-btn')?.addEventListener('click', async () => {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
        window.dataManager.init();
        showToast('Datos sincronizados y caché actualizada con éxito');
        renderCurrentView();
    });

    // Navigation and View Switcher
    const viewTitles = {
        dashboard: { title: 'Dashboard Ejecutivo', subtitle: 'Resumen general y estado de citas del día' },
        agenda: { title: 'Agenda Diaria & Horarios', subtitle: 'Vista de timeline y disponibilidad de turnos por especialista' },
        appointments: { title: 'Gestión de Citas', subtitle: 'Control, confirmación y recordatorios por WhatsApp' },
        services: { title: 'Catálogo de Servicios', subtitle: 'Manicura, pedicura, peluquería y tintura con precios' },
        staff: { title: 'Profesionales & Horarios', subtitle: 'Equipo de especialistas, turnos y áreas de atención' },
        clients: { title: 'Directorio de Clientes Registrados', subtitle: 'Listado consolidado de clientas, historial de visitas y contacto' },
        settings: { title: 'Configuración & Sistema', subtitle: 'Datos del spa y opciones de copia de seguridad' }
    };

    function switchView(viewName) {
        state.currentView = viewName;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-view') === viewName);
        });

        // Update view sections
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.toggle('active', section.id === `view-${viewName}`);
        });

        // Update topbar titles
        if (viewTitles[viewName]) {
            document.getElementById('current-view-title').textContent = viewTitles[viewName].title;
            document.getElementById('current-view-subtitle').textContent = viewTitles[viewName].subtitle;
        }

        // Render view content
        renderCurrentView();
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            if (targetView) switchView(targetView);
        });
    });

    function renderCurrentView() {
        switch (state.currentView) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'agenda':
                renderAgenda();
                break;
            case 'appointments':
                renderAppointmentsTable();
                break;
            case 'services':
                renderServicesList();
                break;
            case 'staff':
                renderStaffList();
                break;
            case 'clients':
                renderClientsList();
                break;
            case 'settings':
                renderSettings();
                break;
        }
    }

    // =========================================================================
    // 1. DASHBOARD VIEW CONTROLLER
    // =========================================================================
    function renderDashboard() {
        const appointments = window.dataManager.getAppointments();
        const services = window.dataManager.getServices();
        const staff = window.dataManager.getStaff();
        const todayStr = getTodayString();

        const todayAppointments = appointments.filter(a => a.date === todayStr);
        const confirmedToday = todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'completed');
        const todayRevenue = confirmedToday.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

        // Update KPI counters
        document.getElementById('kpi-today-count').textContent = todayAppointments.length;
        document.getElementById('kpi-today-status-breakdown').textContent = `${confirmedToday.length} confirmadas/atendidas`;
        document.getElementById('kpi-today-revenue').textContent = formatCurrency(todayRevenue);
        document.getElementById('kpi-services-count').textContent = services.length;
        document.getElementById('kpi-staff-count').textContent = staff.filter(s => s.status === 'active').length;

        // Render Today's appointments list
        const todayListEl = document.getElementById('dash-today-appointments-list');
        todayListEl.innerHTML = '';

        if (todayAppointments.length === 0) {
            todayListEl.innerHTML = `
                <div style="text-align: center; padding: 2.5rem; color: var(--text-light);">
                    <i class="fa-regular fa-calendar" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    <p>No hay citas programadas para el día de hoy.</p>
                </div>
            `;
        } else {
            // Sort by time
            todayAppointments.sort((a, b) => a.time.localeCompare(b.time));

            todayAppointments.forEach(apt => {
                const item = document.createElement('div');
                item.className = 'today-item';
                
                const statusBadgeClass = `status-${apt.status}`;
                const statusLabels = {
                    confirmed: 'Confirmada',
                    pending: 'Pendiente',
                    completed: 'Completada',
                    cancelled: 'Cancelada'
                };

                item.innerHTML = `
                    <div class="today-time">
                        <span>${formatTime12h(apt.time)}</span>
                    </div>
                    <div class="today-info">
                        <h4>${apt.clientName}</h4>
                        <p><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--primary); font-size:0.75rem; margin-right:4px;"></i> ${apt.serviceName} &bull; <i class="fa-solid fa-user" style="color:var(--gold); font-size:0.75rem; margin-right:4px;"></i> ${apt.staffName}</p>
                    </div>
                    <div class="today-actions">
                        <span class="status-badge ${statusBadgeClass}">${statusLabels[apt.status] || apt.status}</span>
                        <button class="btn-whatsapp btn-dash-whatsapp" data-id="${apt.id}" title="Enviar recordatorio WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button class="btn-icon btn-dash-view" data-id="${apt.id}" title="Ver Detalle">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                `;
                todayListEl.appendChild(item);
            });

            // Action listeners
            todayListEl.querySelectorAll('.btn-dash-view').forEach(btn => {
                btn.addEventListener('click', () => {
                    const aptId = btn.getAttribute('data-id');
                    openAppointmentDetail(aptId);
                });
            });

            todayListEl.querySelectorAll('.btn-dash-whatsapp').forEach(btn => {
                btn.addEventListener('click', () => {
                    const aptId = btn.getAttribute('data-id');
                    sendWhatsAppReminder(aptId);
                });
            });
        }

        // Render Category Demand Bars
        const catBarsEl = document.getElementById('dash-category-bars');
        catBarsEl.innerHTML = '';
        const categories = window.dataManager.getCategories();
        
        // Count category occurrences in all appointments
        const categoryCounts = { manicura: 0, pedicura: 0, peluqueria: 0, tintura: 0 };
        appointments.forEach(apt => {
            const srv = services.find(s => s.id === apt.serviceId);
            if (srv && categoryCounts[srv.category] !== undefined) {
                categoryCounts[srv.category]++;
            }
        });

        const totalCategoryApts = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;
        const catColors = {
            manicura: 'var(--primary)',
            pedicura: 'var(--emerald)',
            peluqueria: '#3b82f6',
            tintura: 'var(--gold)'
        };

        categories.forEach(cat => {
            const count = categoryCounts[cat.id] || 0;
            const percentage = Math.round((count / totalCategoryApts) * 100);

            const catItem = document.createElement('div');
            catItem.className = 'cat-bar-item';
            catItem.innerHTML = `
                <div class="cat-bar-header">
                    <span><i class="fa-solid ${cat.icon}" style="margin-right: 6px; color: ${catColors[cat.id]};"></i> ${cat.name}</span>
                    <span>${count} citas (${percentage}%)</span>
                </div>
                <div class="cat-progress-bg">
                    <div class="cat-progress-fill" style="width: ${percentage}%; background: ${catColors[cat.id]};"></div>
                </div>
            `;
            catBarsEl.appendChild(catItem);
        });
    }

    document.getElementById('dash-view-all-appointments-btn')?.addEventListener('click', () => {
        switchView('appointments');
    });

    // =========================================================================
    // 2. AGENDA / CALENDAR VIEW CONTROLLER
    // =========================================================================
    function renderAgenda() {
        const container = document.getElementById('timeline-schedule-container');
        const dateLabel = document.getElementById('agenda-current-date-label');
        const datePicker = document.getElementById('agenda-datepicker');
        const staffFilter = document.getElementById('agenda-staff-filter');

        datePicker.value = state.selectedAgendaDate;
        dateLabel.textContent = formatDateDisplay(state.selectedAgendaDate);

        // Populate staff filter
        const staffList = window.dataManager.getStaff();
        staffFilter.innerHTML = '<option value="all">Todos los Profesionales</option>';
        staffList.forEach(st => {
            const opt = document.createElement('option');
            opt.value = st.id;
            opt.textContent = st.name;
            if (state.agendaStaffFilter === st.id) opt.selected = true;
            staffFilter.appendChild(opt);
        });

        container.innerHTML = '';
        const appointments = window.dataManager.getAppointments().filter(a => a.date === state.selectedAgendaDate);

        // Timeline hours from 08:00 to 20:00
        const hours = [
            '08:00', '09:00', '10:00', '11:00', '12:00', 
            '13:00', '14:00', '15:00', '16:00', '17:00', 
            '18:00', '19:00', '20:00'
        ];

        hours.forEach(hourStr => {
            const slot = document.createElement('div');
            slot.className = 'timeline-slot';

            const hourCol = document.createElement('div');
            hourCol.className = 'timeline-hour';
            hourCol.textContent = formatTime12h(hourStr);
            slot.appendChild(hourCol);

            const contentCol = document.createElement('div');
            contentCol.className = 'timeline-content';

            // Find appointments starting in this hour bracket
            const hourInt = parseInt(hourStr.split(':')[0], 10);
            const slotAppointments = appointments.filter(a => {
                const aHour = parseInt(a.time.split(':')[0], 10);
                const matchesStaff = state.agendaStaffFilter === 'all' || a.staffId === state.agendaStaffFilter;
                return aHour === hourInt && matchesStaff;
            });

            if (slotAppointments.length > 0) {
                slotAppointments.forEach(apt => {
                    const chip = document.createElement('div');
                    chip.className = 'apt-card-chip';
                    
                    const staffMember = staffList.find(s => s.id === apt.staffId);
                    const staffColor = staffMember ? staffMember.color : 'var(--primary)';
                    chip.style.borderLeftColor = staffColor;

                    chip.innerHTML = `
                        <div class="chip-header">
                            <span>${apt.clientName}</span>
                            <span>${formatTime12h(apt.time)} (${apt.duration} min)</span>
                        </div>
                        <div class="chip-service">${apt.serviceName}</div>
                        <div class="chip-staff">
                            <i class="fa-solid fa-user-check" style="color:${staffColor}"></i>
                            <span>${apt.staffName}</span>
                        </div>
                    `;
                    chip.addEventListener('click', () => openAppointmentDetail(apt.id));
                    contentCol.appendChild(chip);
                });
            } else {
                contentCol.innerHTML = `<span style="font-size: 0.78rem; color: #b5ada5; padding-top: 0.4rem;">Disponible</span>`;
            }

            slot.appendChild(contentCol);
            container.appendChild(slot);
        });
    }

    // Agenda Navigation Events
    document.getElementById('agenda-prev-day-btn')?.addEventListener('click', () => {
        const parts = state.selectedAgendaDate.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() - 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        state.selectedAgendaDate = `${year}-${month}-${day}`;
        renderAgenda();
    });

    document.getElementById('agenda-next-day-btn')?.addEventListener('click', () => {
        const parts = state.selectedAgendaDate.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        state.selectedAgendaDate = `${year}-${month}-${day}`;
        renderAgenda();
    });

    document.getElementById('agenda-today-btn')?.addEventListener('click', () => {
        state.selectedAgendaDate = getTodayString();
        renderAgenda();
    });

    document.getElementById('agenda-datepicker')?.addEventListener('change', (e) => {
        if (e.target.value) {
            state.selectedAgendaDate = e.target.value;
            renderAgenda();
        }
    });

    document.getElementById('agenda-staff-filter')?.addEventListener('change', (e) => {
        state.agendaStaffFilter = e.target.value;
        renderAgenda();
    });

    // =========================================================================
    // 3. APPOINTMENTS TABLE VIEW CONTROLLER
    // =========================================================================
    function renderAppointmentsTable() {
        const tbody = document.getElementById('appointments-table-body');
        tbody.innerHTML = '';

        let appointments = window.dataManager.getAppointments();
        const services = window.dataManager.getServices();

        // Apply Search Filter
        if (state.appointmentsSearch.trim()) {
            const query = state.appointmentsSearch.toLowerCase().trim();
            appointments = appointments.filter(a => 
                (a.clientName && a.clientName.toLowerCase().includes(query)) ||
                (a.clientPhone && a.clientPhone.toLowerCase().includes(query)) ||
                (a.serviceName && a.serviceName.toLowerCase().includes(query)) ||
                (a.staffName && a.staffName.toLowerCase().includes(query))
            );
        }

        // Apply Status Filter
        if (state.appointmentsStatusFilter !== 'all') {
            appointments = appointments.filter(a => a.status === state.appointmentsStatusFilter);
        }

        // Apply Category Filter
        if (state.appointmentsCategoryFilter !== 'all') {
            appointments = appointments.filter(a => {
                const srv = services.find(s => s.id === a.serviceId);
                return srv && srv.category === state.appointmentsCategoryFilter;
            });
        }

        // Sort by Date and Time descending
        appointments.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

        if (appointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block;"></i>
                        <p>No se encontraron citas con los filtros seleccionados.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const statusLabels = {
            confirmed: 'Confirmada',
            pending: 'Pendiente',
            completed: 'Completada',
            cancelled: 'Cancelada'
        };

        appointments.forEach(apt => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 700;">${formatDateDisplay(apt.date)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-light);">${formatTime12h(apt.time)} (${apt.duration} min)</div>
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--text-main);">${apt.clientName}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> ${apt.clientPhone}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${apt.serviceName}</div>
                </td>
                <td>
                    <div style="font-weight: 600; color: var(--gold);">${apt.staffName}</div>
                </td>
                <td>
                    <div style="font-weight: 800; color: var(--text-main);">${formatCurrency(apt.price)}</div>
                </td>
                <td>
                    <select class="form-control table-status-selector" data-id="${apt.id}" style="padding: 0.3rem 0.6rem; font-size: 0.82rem; font-weight:700; border-radius: var(--radius-full); width: auto;">
                        <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                        <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>Completada</option>
                        <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                        <button class="btn-whatsapp btn-table-wa" data-id="${apt.id}" title="Recordatorio WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button class="btn-icon btn-table-view" data-id="${apt.id}" title="Ver Comprobante">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger btn-table-delete" data-id="${apt.id}" title="Eliminar Cita">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Status change listener
        tbody.querySelectorAll('.table-status-selector').forEach(select => {
            select.addEventListener('change', (e) => {
                const aptId = select.getAttribute('data-id');
                const newStatus = e.target.value;
                window.dataManager.updateAppointmentStatus(aptId, newStatus);
                showToast(`Estado de la cita actualizado a "${statusLabels[newStatus]}"`);
            });
        });

        // View detail listeners
        tbody.querySelectorAll('.btn-table-view').forEach(btn => {
            btn.addEventListener('click', () => {
                const aptId = btn.getAttribute('data-id');
                openAppointmentDetail(aptId);
            });
        });

        // WhatsApp listeners
        tbody.querySelectorAll('.btn-table-wa').forEach(btn => {
            btn.addEventListener('click', () => {
                const aptId = btn.getAttribute('data-id');
                sendWhatsAppReminder(aptId);
            });
        });

        // Delete listeners
        tbody.querySelectorAll('.btn-table-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const aptId = btn.getAttribute('data-id');
                if (confirm('¿Estás seguro de eliminar esta cita de la agenda?')) {
                    window.dataManager.deleteAppointment(aptId);
                    showToast('Cita eliminada correctamente', 'info');
                    renderAppointmentsTable();
                }
            });
        });
    }

    // Search and Filters for Appointments
    document.getElementById('appointments-search-input')?.addEventListener('input', (e) => {
        state.appointmentsSearch = e.target.value;
        renderAppointmentsTable();
    });

    document.getElementById('appointments-status-filter')?.addEventListener('change', (e) => {
        state.appointmentsStatusFilter = e.target.value;
        renderAppointmentsTable();
    });

    document.getElementById('appointments-category-filter')?.addEventListener('change', (e) => {
        state.appointmentsCategoryFilter = e.target.value;
        renderAppointmentsTable();
    });

    // =========================================================================
    // 4. SERVICES CATALOG VIEW CONTROLLER
    // =========================================================================
    function renderServicesList() {
        const grid = document.getElementById('services-cards-grid');
        grid.innerHTML = '';

        let services = window.dataManager.getServices();

        if (state.selectedServiceCategory !== 'all') {
            services = services.filter(s => s.category === state.selectedServiceCategory);
        }

        if (services.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-light);">
                    <p>No hay servicios registrados en esta categoría.</p>
                </div>
            `;
            return;
        }

        const categoryNames = {
            manicura: 'Manicura',
            pedicura: 'Pedicura',
            peluqueria: 'Peluquería',
            tintura: 'Tintura y Color'
        };

        services.forEach(srv => {
            const card = document.createElement('div');
            card.className = 'service-card';

            const imgMarkup = srv.image 
                ? `<img src="${srv.image}" alt="${srv.name}" class="service-card-img" onerror="this.outerHTML='<div class=\\'service-card-img-placeholder\\'><i class=\\'fa-solid fa-spa\\'></i></div>'">`
                : `<div class="service-card-img-placeholder"><i class="fa-solid fa-spa"></i></div>`;

            card.innerHTML = `
                ${imgMarkup}
                <div class="service-card-body">
                    <span class="service-category-badge">${categoryNames[srv.category] || srv.category}</span>
                    <h4 class="service-card-title">${srv.name}</h4>
                    <p class="service-card-desc">${srv.description}</p>
                    <div class="service-meta">
                        <div class="service-price">${formatCurrency(srv.price)}</div>
                        <div class="service-duration"><i class="fa-regular fa-clock"></i> ${srv.duration} min</div>
                    </div>
                    <div class="service-actions">
                        <button class="btn-secondary btn-srv-edit" data-id="${srv.id}" style="flex:1; justify-content:center;">
                            <i class="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <button class="btn-icon btn-icon-danger btn-srv-delete" data-id="${srv.id}" title="Eliminar Servicio">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        // Edit Service
        grid.querySelectorAll('.btn-srv-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const srvId = btn.getAttribute('data-id');
                openServiceModal(srvId);
            });
        });

        // Delete Service
        grid.querySelectorAll('.btn-srv-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const srvId = btn.getAttribute('data-id');
                if (confirm('¿Deseas eliminar este servicio del catálogo?')) {
                    window.dataManager.deleteService(srvId);
                    showToast('Servicio eliminado', 'info');
                    renderServicesList();
                }
            });
        });
    }

    // Category pills filter
    document.querySelectorAll('#services-category-pills .cat-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#services-category-pills .cat-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.selectedServiceCategory = pill.getAttribute('data-category');
            renderServicesList();
        });
    });

    function openServiceModal(serviceId = null) {
        const modalTitle = document.getElementById('modal-service-title');
        const form = document.getElementById('service-form');
        form.reset();

        const previewEl = document.getElementById('service-image-preview');
        const fileInput = document.getElementById('service-image-file');
        if (fileInput) fileInput.value = '';

        if (serviceId) {
            const srv = window.dataManager.getServiceById(serviceId);
            if (srv) {
                modalTitle.textContent = 'Editar Servicio y Precios';
                document.getElementById('service-form-id').value = srv.id;
                document.getElementById('service-name').value = srv.name;
                document.getElementById('service-category').value = srv.category;
                document.getElementById('service-price').value = srv.price;
                document.getElementById('service-duration').value = srv.duration;
                document.getElementById('service-image').value = srv.image || '';
                document.getElementById('service-description').value = srv.description;
                if (previewEl) {
                    previewEl.src = srv.image || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80';
                }
            }
        } else {
            modalTitle.textContent = 'Nuevo Servicio';
            document.getElementById('service-form-id').value = '';
            document.getElementById('service-image').value = '';
            if (previewEl) {
                previewEl.src = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80';
            }
        }

        openModal('modal-service');
    }

    // Helper for service image compression
    function compressServiceImage(file, maxWidth = 600, maxHeight = 400, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    document.getElementById('service-image-file')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const base64 = await compressServiceImage(file);
            document.getElementById('service-image').value = base64;
            const previewEl = document.getElementById('service-image-preview');
            if (previewEl) previewEl.src = base64;
        } catch (err) {
            showToast('Error al procesar la imagen del servicio', 'error');
        }
    });

    document.getElementById('btn-add-new-service')?.addEventListener('click', () => openServiceModal(null));

    document.getElementById('service-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('service-form-id').value;
        const name = document.getElementById('service-name').value.trim();
        const category = document.getElementById('service-category').value;
        const price = Number(document.getElementById('service-price').value);
        const duration = Number(document.getElementById('service-duration').value);
        const image = document.getElementById('service-image').value.trim() || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80';
        const description = document.getElementById('service-description').value.trim();

        if (!name || !price || !duration) {
            showToast('Por favor completa los campos obligatorios', 'error');
            return;
        }

        const serviceData = {
            id: id || undefined,
            name,
            category,
            price,
            duration,
            image,
            description
        };

        window.dataManager.saveService(serviceData);
        closeModal('modal-service');
        showToast(id ? 'Servicio, foto y precio actualizados con éxito' : 'Nuevo servicio agregado al catálogo');
        renderServicesList();
    });

    // =========================================================================
    // 5. STAFF & SCHEDULES VIEW CONTROLLER
    // =========================================================================
    function renderStaffList() {
        const grid = document.getElementById('staff-cards-grid');
        grid.innerHTML = '';

        const staffList = window.dataManager.getStaff();
        const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // 0 is Sun, 1 is Mon...

        staffList.forEach(st => {
            const card = document.createElement('div');
            card.className = 'staff-card';

            const specialtiesBadges = st.specialties.map(spec => {
                const label = { manicura: 'Manicura', pedicura: 'Pedicura', peluqueria: 'Peluquería', tintura: 'Tintura' }[spec] || spec;
                return `<span class="specialty-badge">${label}</span>`;
            }).join('');

            // Working days indicator dots
            const daysChipsMarkup = [1, 2, 3, 4, 5, 6, 0].map(dayNum => {
                const isActive = st.workingDays && st.workingDays.includes(dayNum);
                return `<div class="day-dot ${isActive ? 'active' : ''}">${dayNames[dayNum]}</div>`;
            }).join('');

            card.innerHTML = `
                <div class="staff-header">
                    <img src="${st.avatar}" alt="${st.name}" class="staff-avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60'">
                    <div class="staff-name-title">
                        <h4>${st.name}</h4>
                        <span>${st.title}</span>
                    </div>
                </div>

                <div class="staff-badges">
                    ${specialtiesBadges}
                </div>

                <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.4;">${st.bio || ''}</p>

                <div class="staff-schedule-info">
                    <div class="schedule-row">
                        <span class="schedule-label"><i class="fa-regular fa-clock"></i> Horario de Atención:</span>
                        <span class="schedule-val">${formatTime12h(st.startTime)} - ${formatTime12h(st.endTime)}</span>
                    </div>
                    <div class="schedule-row">
                        <span class="schedule-label"><i class="fa-solid fa-phone"></i> Contacto:</span>
                        <span class="schedule-val">${st.phone}</span>
                    </div>
                    <div style="margin-top: 0.6rem;">
                        <span class="schedule-label">Días Laborales:</span>
                        <div class="days-chips">
                            ${daysChipsMarkup}
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                    <button class="btn-secondary btn-staff-edit" data-id="${st.id}" style="flex:1; justify-content:center;">
                        <i class="fa-solid fa-user-pen"></i> Editar Horario
                    </button>
                    <button class="btn-icon btn-icon-danger btn-staff-delete" data-id="${st.id}" title="Eliminar Especialista">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Edit staff
        grid.querySelectorAll('.btn-staff-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const staffId = btn.getAttribute('data-id');
                openStaffModal(staffId);
            });
        });

        // Delete staff
        grid.querySelectorAll('.btn-staff-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const staffId = btn.getAttribute('data-id');
                if (confirm('¿Deseas eliminar a este profesional del equipo?')) {
                    window.dataManager.deleteStaff(staffId);
                    showToast('Especialista eliminado', 'info');
                    renderStaffList();
                }
            });
        });
    }

    function openStaffModal(staffId = null) {
        const modalTitle = document.getElementById('modal-staff-title');
        const form = document.getElementById('staff-form');
        form.reset();

        // Clear checkboxes
        document.querySelectorAll('input[name="staff-spec"]').forEach(cb => cb.checked = false);

        if (staffId) {
            const st = window.dataManager.getStaffById(staffId);
            if (st) {
                modalTitle.textContent = 'Editar Especialista & Turnos';
                document.getElementById('staff-form-id').value = st.id;
                document.getElementById('staff-name').value = st.name;
                document.getElementById('staff-title').value = st.title;
                document.getElementById('staff-phone').value = st.phone;
                document.getElementById('staff-email').value = st.email || '';
                document.getElementById('staff-start-time').value = st.startTime;
                document.getElementById('staff-end-time').value = st.endTime;
                document.getElementById('staff-avatar').value = st.avatar || '';
                document.getElementById('staff-bio').value = st.bio || '';

                if (st.specialties && Array.isArray(st.specialties)) {
                    st.specialties.forEach(spec => {
                        const cb = document.querySelector(`input[name="staff-spec"][value="${spec}"]`);
                        if (cb) cb.checked = true;
                    });
                }

                // Populate working days (1=Mon..6=Sat, 0=Sun)
                const workingDays = st.workingDays || [1, 2, 3, 4, 5, 6];
                document.querySelectorAll('input[name="staff-workday"]').forEach(cb => {
                    cb.checked = workingDays.includes(parseInt(cb.value));
                });

                const previewEl = document.getElementById('staff-avatar-preview');
                if (previewEl) {
                    previewEl.src = st.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60';
                }
            }
        } else {
            modalTitle.textContent = 'Nuevo Especialista';
            document.getElementById('staff-form-id').value = '';
            document.getElementById('staff-start-time').value = '09:00';
            document.getElementById('staff-end-time').value = '18:00';
            document.querySelectorAll('input[name="staff-workday"]').forEach(cb => {
                cb.checked = cb.value !== '0'; // Mon-Sat default
            });
            const previewEl = document.getElementById('staff-avatar-preview');
            if (previewEl) {
                previewEl.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60';
            }
            document.getElementById('staff-avatar').value = '';
        }

        const fileInput = document.getElementById('staff-avatar-file');
        if (fileInput) fileInput.value = '';

        openModal('modal-staff');
    }

    // Helper for staff image compression
    function compressStaffImage(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    document.getElementById('staff-avatar-file')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const base64 = await compressStaffImage(file);
            document.getElementById('staff-avatar').value = base64;
            const previewEl = document.getElementById('staff-avatar-preview');
            if (previewEl) previewEl.src = base64;
        } catch (err) {
            showToast('Error al procesar la imagen del especialista', 'error');
        }
    });

    document.getElementById('btn-add-new-staff')?.addEventListener('click', () => openStaffModal(null));

    document.getElementById('staff-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('staff-form-id').value;
        const name = document.getElementById('staff-name').value.trim();
        const title = document.getElementById('staff-title').value.trim();
        const phone = document.getElementById('staff-phone').value.trim();
        const email = document.getElementById('staff-email').value.trim();
        const startTime = document.getElementById('staff-start-time').value;
        const endTime = document.getElementById('staff-end-time').value;
        const avatar = document.getElementById('staff-avatar').value.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60';
        const bio = document.getElementById('staff-bio').value.trim();

        const selectedSpecs = Array.from(document.querySelectorAll('input[name="staff-spec"]:checked')).map(cb => cb.value);
        const selectedWorkdays = Array.from(document.querySelectorAll('input[name="staff-workday"]:checked')).map(cb => parseInt(cb.value));

        if (!name || !title || !phone || selectedSpecs.length === 0) {
            showToast('Por favor completa los datos obligatorios y selecciona al menos una especialidad', 'error');
            return;
        }

        if (selectedWorkdays.length === 0) {
            showToast('Selecciona al menos un día de trabajo en la semana', 'error');
            return;
        }

        const colors = ['#E06D85', '#9333EA', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const existingStaff = id ? window.dataManager.getStaffById(id) : null;

        const staffData = {
            id: id || undefined,
            name,
            title,
            phone,
            email,
            specialties: selectedSpecs,
            startTime,
            endTime,
            avatar,
            bio,
            color: existingStaff ? existingStaff.color : randomColor,
            workingDays: selectedWorkdays,
            status: 'active'
        };

        window.dataManager.saveStaff(staffData);
        closeModal('modal-staff');
        showToast(id ? 'Datos, foto, turnos y días de trabajo actualizados' : 'Especialista agregado al equipo');
        renderStaffList();
    });

    // =========================================================================
    // 6. APPOINTMENT RESERVATION MODAL (CREATE / EDIT)
    // =========================================================================
    function populateAppointmentFormDropdowns(selectedServiceId = null, selectedStaffId = null) {
        const srvSelect = document.getElementById('apt-service-select');
        const stfSelect = document.getElementById('apt-staff-select');

        srvSelect.innerHTML = '<option value="">Seleccione un servicio...</option>';
        const services = window.dataManager.getServices();
        const categories = window.dataManager.getCategories();

        categories.forEach(cat => {
            const catServices = services.filter(s => s.category === cat.id);
            if (catServices.length > 0) {
                const optGroup = document.createElement('optgroup');
                optGroup.label = cat.name;
                catServices.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = `${s.name} (${s.duration} min - ${formatCurrency(s.price)})`;
                    if (selectedServiceId === s.id) opt.selected = true;
                    optGroup.appendChild(opt);
                });
                srvSelect.appendChild(optGroup);
            }
        });

        // Function to update staff dropdown based on chosen service
        function updateStaffDropdown(srvId) {
            stfSelect.innerHTML = '<option value="">Seleccione profesional disponible...</option>';
            const chosenService = window.dataManager.getServiceById(srvId);
            let availableStaff = window.dataManager.getStaff();

            if (chosenService) {
                // Filter staff that offer this service category
                availableStaff = availableStaff.filter(st => st.specialties.includes(chosenService.category));
                document.getElementById('apt-price-display').value = formatCurrency(chosenService.price);
            } else {
                document.getElementById('apt-price-display').value = '';
            }

            availableStaff.forEach(st => {
                const opt = document.createElement('option');
                opt.value = st.id;
                opt.textContent = `${st.name} (${st.title})`;
                if (selectedStaffId === st.id) opt.selected = true;
                stfSelect.appendChild(opt);
            });
        }

        srvSelect.onchange = () => updateStaffDropdown(srvSelect.value);
        updateStaffDropdown(selectedServiceId);
    }

    function openNewAppointmentModal(prefillDate = null, prefillTime = null) {
        const form = document.getElementById('appointment-form');
        form.reset();
        document.getElementById('apt-form-id').value = '';
        document.getElementById('modal-appointment-title').textContent = 'Agendar Nueva Cita';

        populateAppointmentFormDropdowns();

        document.getElementById('apt-date').value = prefillDate || getTodayString();
        document.getElementById('apt-time').value = prefillTime || '10:00';
        document.getElementById('apt-status').value = 'confirmed';

        openModal('modal-appointment');
    }

    document.getElementById('topbar-new-appointment-btn')?.addEventListener('click', () => openNewAppointmentModal());
    document.getElementById('sidebar-quick-booking-btn')?.addEventListener('click', () => openNewAppointmentModal());

    document.getElementById('appointment-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('apt-form-id').value;
        const clientName = document.getElementById('apt-client-name').value.trim();
        const clientPhone = document.getElementById('apt-client-phone').value.trim();
        const serviceId = document.getElementById('apt-service-select').value;
        const staffId = document.getElementById('apt-staff-select').value;
        const date = document.getElementById('apt-date').value;
        const time = document.getElementById('apt-time').value;
        const status = document.getElementById('apt-status').value;
        const notes = document.getElementById('apt-notes').value.trim();

        if (!clientName || !clientPhone || !serviceId || !staffId || !date || !time) {
            showToast('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        const service = window.dataManager.getServiceById(serviceId);
        const staffMember = window.dataManager.getStaffById(staffId);

        if (!service || !staffMember) {
            showToast('Servicio o especialista no encontrado', 'error');
            return;
        }

        const aptData = {
            id: id || undefined,
            clientName,
            clientPhone,
            serviceId,
            serviceName: service.name,
            staffId,
            staffName: staffMember.name,
            date,
            time,
            duration: service.duration,
            price: service.price,
            status,
            notes
        };

        window.dataManager.saveAppointment(aptData);
        closeModal('modal-appointment');
        showToast(id ? 'Cita modificada con éxito' : '¡Cita agendada exitosamente en LETY LOOK!');
        renderCurrentView();
    });

    // =========================================================================
    // 7. APPOINTMENT DETAIL VOUCHER & WHATSAPP GENERATOR
    // =========================================================================
    function openAppointmentDetail(aptId) {
        const apt = window.dataManager.getAppointmentById(aptId);
        if (!apt) return;

        const content = document.getElementById('apt-detail-content');
        const footer = document.getElementById('apt-detail-footer');
        const settings = window.dataManager.getSettings();

        const statusBadges = {
            confirmed: '<span class="status-badge status-confirmed">Confirmada</span>',
            pending: '<span class="status-badge status-pending">Pendiente</span>',
            completed: '<span class="status-badge status-completed">Completada</span>',
            cancelled: '<span class="status-badge status-cancelled">Cancelada</span>'
        };

        content.innerHTML = `
            <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1.5rem; border: 1px dashed var(--border-color); text-align: center; margin-bottom: 1.5rem;">
                <div style="font-family:'Playfair Display', serif; font-size:1.5rem; font-weight:700; color:var(--primary); margin-bottom:0.2rem;">LETY LOOK</div>
                <div style="font-size:0.75rem; color:var(--gold); letter-spacing:1px; text-transform:uppercase; font-weight:700;">Comprobante de Reserva</div>
                <div style="margin-top: 0.75rem;">${statusBadges[apt.status] || ''}</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.85rem; font-size:0.9rem;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Cliente:</span>
                    <span style="font-weight:700;">${apt.clientName}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">WhatsApp:</span>
                    <span style="font-weight:600;">${apt.clientPhone}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Servicio:</span>
                    <span style="font-weight:700; color:var(--primary);">${apt.serviceName}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Especialista:</span>
                    <span style="font-weight:600; color:var(--gold);">${apt.staffName}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Fecha y Hora:</span>
                    <span style="font-weight:700;">${formatDateDisplay(apt.date)} a las ${formatTime12h(apt.time)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Duración:</span>
                    <span>${apt.duration} minutos</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Total a Cancelar:</span>
                    <span style="font-size:1.15rem; font-weight:800; color:var(--text-main);">${formatCurrency(apt.price)}</span>
                </div>
                ${apt.notes ? `
                    <div style="background:#fff; border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.8rem; font-size:0.82rem; color:var(--text-muted);">
                        <strong>Notas:</strong> ${apt.notes}
                    </div>
                ` : ''}
            </div>
        `;

        footer.innerHTML = `
            <button type="button" class="btn-secondary" data-close-modal="modal-apt-detail">Cerrar</button>
            <button type="button" class="btn-whatsapp" id="btn-modal-send-staff-wa" style="background:#0d9488;">
                <i class="fa-brands fa-whatsapp"></i> Notificar a Especialista
            </button>
            <button type="button" class="btn-whatsapp" id="btn-modal-send-wa">
                <i class="fa-brands fa-whatsapp"></i> Recordatorio a Cliente
            </button>
        `;

        footer.querySelector('#btn-modal-send-wa').addEventListener('click', () => {
            sendWhatsAppReminder(apt.id);
        });

        footer.querySelector('#btn-modal-send-staff-wa').addEventListener('click', () => {
            sendStaffNotificationFromAdmin(apt.id);
        });

        footer.querySelector('[data-close-modal="modal-apt-detail"]').addEventListener('click', () => {
            closeModal('modal-apt-detail');
        });

        openModal('modal-apt-detail');
    }

    function sendWhatsAppReminder(aptId) {
        const apt = window.dataManager.getAppointmentById(aptId);
        if (!apt) return;

        const settings = window.dataManager.getSettings();
        const cleanPhone = apt.clientPhone.replace(/\D/g, '');

        const message = `✨ *RECORDATORIO DE CITA - SPA LETY LOOK* ✨\n\n` +
            `Hola *${apt.clientName}*, te confirmamos con mucho gusto los detalles de tu cita en *${settings.spaName}*:\n\n` +
            `📅 *Fecha:* ${formatDateDisplay(apt.date)}\n` +
            `⏰ *Hora:* ${formatTime12h(apt.time)}\n` +
            `💅 *Servicio:* ${apt.serviceName}\n` +
            `👩‍🎨 *Especialista:* ${apt.staffName}\n` +
            `⏱️ *Duración estimada:* ${apt.duration} min\n` +
            `💰 *Valor:* ${formatCurrency(apt.price)}\n` +
            `📍 *Ubicación:* ${settings.address}\n\n` +
            `¡Será un gran placer consentirte y resaltar tu belleza! ✨ Si necesitas reprogramar, por favor avísanos con anticipación al ${settings.phone}.`;

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    }

    function sendStaffNotificationFromAdmin(aptId) {
        const apt = window.dataManager.getAppointmentById(aptId);
        if (!apt) return;

        const staff = window.dataManager.getStaffById(apt.staffId);
        const cleanPhone = staff && staff.phone ? staff.phone.replace(/\D/g, '') : '573138869676';

        const message = `🌸 *ASIGNACIÓN DE CITA - SPA LETY LOOK* 🌸\n\n` +
            `Hola *${apt.staffName}*, tienes un nuevo turno programado:\n\n` +
            `👤 *Cliente:* ${apt.clientName}\n` +
            `📱 *WhatsApp Cliente:* ${apt.clientPhone}\n` +
            `💅 *Tratamiento:* ${apt.serviceName}\n` +
            `📅 *Fecha:* ${formatDateDisplay(apt.date)}\n` +
            `⏰ *Hora:* ${formatTime12h(apt.time)} (${apt.duration} min)\n` +
            `💰 *Precio:* ${formatCurrency(apt.price)}\n` +
            `${apt.notes ? `📝 *Notas:* ${apt.notes}\n\n` : '\n'}` +
            `¡Por favor confirma tu disponibilidad! ✨`;

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    }

    // =========================================================================
    // 6. REGISTERED CLIENTS DIRECTORY CONTROLLER (ADMIN ONLY)
    // =========================================================================
    let clientsSearchQuery = '';

    function renderClientsList() {
        const tbody = document.getElementById('clients-table-body');
        const counterEl = document.getElementById('clients-total-counter');
        tbody.innerHTML = '';

        let clients = window.dataManager.getClients();
        const allAppointments = window.dataManager.getAppointments();

        if (counterEl) counterEl.textContent = `Total Registradas: ${clients.length}`;

        // Search query filter
        if (clientsSearchQuery.trim()) {
            const query = clientsSearchQuery.toLowerCase().trim();
            clients = clients.filter(c => 
                (c.name && c.name.toLowerCase().includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query)) ||
                (c.phone && c.phone.includes(query))
            );
        }

        if (clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fa-solid fa-users-slash" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block;"></i>
                        <p>No se encontraron clientas registradas con el criterio de búsqueda.</p>
                    </td>
                </tr>
            `;
            return;
        }

        clients.forEach(c => {
            const tr = document.createElement('tr');

            // Calculate total appointments and spent
            const clientApts = window.dataManager.getClientAppointments(c.id, c.email, c.phone);
            const confirmedApts = clientApts.filter(a => a.status === 'confirmed' || a.status === 'completed');
            const totalSpent = confirmedApts.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

            const regDateStr = c.createdAt ? (c.createdAt.includes('T') ? c.createdAt.split('T')[0] : c.createdAt) : '--';

            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <img src="${c.avatar}" alt="${c.name}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-light);" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=d45979&color=fff'">
                        <div>
                            <div style="font-weight:700; color:var(--text-main);">${c.name}</div>
                            <div style="font-size:0.75rem; color:var(--gold); font-weight:700;">Cliente Registrada</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-weight:600;"><i class="fa-brands fa-whatsapp" style="color:#25d366; margin-right:4px;"></i> ${c.phone || '--'}</div>
                </td>
                <td>
                    <div style="font-size:0.85rem; color:var(--text-secondary);">${c.email || '--'}</div>
                </td>
                <td>
                    <div style="font-size:0.82rem; color:var(--text-muted);">${formatDateDisplay(regDateStr)}</div>
                </td>
                <td>
                    <span class="status-badge status-completed" style="font-weight:800;">${clientApts.length} cita(s)</span>
                </td>
                <td>
                    <div style="font-weight:800; color:var(--text-main);">${formatCurrency(totalSpent)}</div>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                        <button class="btn-whatsapp btn-client-row-wa" data-phone="${c.phone}" data-name="${c.name}" title="Chatear por WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button class="btn-icon btn-client-row-history" data-id="${c.id}" title="Ver Historial de Citas">
                            <i class="fa-solid fa-receipt"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger btn-client-row-delete" data-id="${c.id}" title="Eliminar de la lista">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // WhatsApp direct chat
        tbody.querySelectorAll('.btn-client-row-wa').forEach(btn => {
            btn.addEventListener('click', () => {
                const phone = btn.getAttribute('data-phone');
                const name = btn.getAttribute('data-name');
                const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
                if (cleanPhone) {
                    const waUrl = `https://wa.me/57${cleanPhone.startsWith('57') ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(`¡Hola ${name}! Te saludamos de LETY LOOK Belleza Integral ✨ ¿En qué podemos consentirte hoy?`)}`;
                    window.open(waUrl, '_blank');
                }
            });
        });

        // View client appointments history
        tbody.querySelectorAll('.btn-client-row-history').forEach(btn => {
            btn.addEventListener('click', () => {
                const clientId = btn.getAttribute('data-id');
                openClientHistoryModal(clientId);
            });
        });

        // Delete client
        tbody.querySelectorAll('.btn-client-row-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const clientId = btn.getAttribute('data-id');
                if (confirm('¿Deseas eliminar a este cliente del registro?')) {
                    window.dataManager.deleteClient(clientId);
                    showToast('Cliente eliminado del directorio', 'info');
                    renderClientsList();
                }
            });
        });
    }

    document.getElementById('clients-search-input')?.addEventListener('input', (e) => {
        clientsSearchQuery = e.target.value;
        renderClientsList();
    });

    function openClientHistoryModal(clientId) {
        const client = window.dataManager.getClientById(clientId);
        if (!client) return;

        const title = document.getElementById('modal-client-history-title');
        const content = document.getElementById('modal-client-history-content');
        title.textContent = `Historial de Citas - ${client.name}`;

        const clientApts = window.dataManager.getClientAppointments(client.id, client.email, client.phone);

        if (clientApts.length === 0) {
            content.innerHTML = `
                <div style="text-align:center; padding:2rem; color:var(--text-light);">
                    <p>Esta clienta aún no tiene citas registradas.</p>
                </div>
            `;
        } else {
            let aptsHtml = `
                <div style="display:flex; flex-direction:column; gap:0.75rem;">
            `;

            const statusBadges = {
                confirmed: '<span class="status-badge status-confirmed">Confirmada</span>',
                pending: '<span class="status-badge status-pending">Pendiente</span>',
                completed: '<span class="status-badge status-completed">Completada</span>',
                cancelled: '<span class="status-badge status-cancelled">Cancelada</span>'
            };

            clientApts.forEach(a => {
                aptsHtml += `
                    <div style="background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:700; color:var(--primary); font-size:0.95rem;">${a.serviceName}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-regular fa-calendar"></i> ${formatDateDisplay(a.date)} a las ${formatTime12h(a.time)} &bull; Especialista: <strong>${a.staffName}</strong></div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.2rem;">${formatCurrency(a.price)}</div>
                            ${statusBadges[a.status] || a.status}
                        </div>
                    </div>
                `;
            });

            aptsHtml += `</div>`;
            content.innerHTML = aptsHtml;
        }

        openModal('modal-client-history');
    }

    // =========================================================================
    // 7. SETTINGS & DATA CONTROLLER (WITH CLOUD FIREBASE)
    // =========================================================================
    function renderSettings() {
        const settings = window.dataManager.getSettings();
        document.getElementById('settings-spa-name').value = settings.spaName || '';
        document.getElementById('settings-spa-slogan').value = settings.slogan || '';
        document.getElementById('settings-spa-phone').value = settings.phone || '';
        document.getElementById('settings-spa-address').value = settings.address || '';
        document.getElementById('settings-open-time').value = settings.openTime || '08:00';
        document.getElementById('settings-close-time').value = settings.closeTime || '20:00';

        // Firebase Cloud Status
        updateCloudStatusBadge();
    }

    function updateCloudStatusBadge() {
        const badge = document.getElementById('cloud-status-badge');
        const configTextarea = document.getElementById('firebase-config-json');
        if (!badge) return;

        if (window.cloudService && window.cloudService.isInitialized) {
            badge.className = 'status-badge status-confirmed';
            badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Conectado a la Nube';
        } else {
            badge.className = 'status-badge status-pending';
            badge.innerHTML = '<i class="fa-solid fa-cloud"></i> Modo Local (Sin Conectar)';
        }

        const currentConfig = window.cloudService ? window.cloudService.getConfig() : null;
        if (currentConfig && configTextarea && !configTextarea.value) {
            configTextarea.value = JSON.stringify(currentConfig, null, 2);
        }
    }

    document.getElementById('firebase-config-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawJson = document.getElementById('firebase-config-json').value.trim();
        if (!rawJson) {
            showToast('Por favor ingresa la configuración de Firebase', 'error');
            return;
        }

        try {
            let configObj = null;
            if (rawJson.startsWith('{')) {
                configObj = JSON.parse(rawJson);
            } else {
                // If pasted as JS object string
                const sanitized = rawJson.replace(/([a-zA-Z0-9]+)\s*:/g, '"$1":').replace(/'/g, '"');
                configObj = JSON.parse(sanitized);
            }

            const res = window.cloudService.saveConfig(configObj);
            if (res.success) {
                showToast('¡Conectado exitosamente a Google Firebase Cloud!');
                updateCloudStatusBadge();
            } else {
                showToast(res.message, 'error');
            }
        } catch (err) {
            showToast('Formato JSON inválido. Verifica las llaves y comillas.', 'error');
        }
    });

    document.getElementById('btn-upload-to-cloud')?.addEventListener('click', async () => {
        if (!window.cloudService || !window.cloudService.isInitialized) {
            showToast('Primero debes guardar y conectar tu configuración de Firebase', 'error');
            return;
        }
        showToast('Subiendo datos a la nube de Google Firebase...', 'info');
        const res = await window.cloudService.uploadAllLocalDataToCloud();
        if (res.success) {
            showToast(res.message);
        } else {
            showToast(res.message, 'error');
        }
    });

    // Real-time Cloud Listener: Re-render UI when cloud changes arrive
    if (window.cloudService) {
        window.cloudService.onSync((collectionName) => {
            console.log(`Cloud sync event received for: ${collectionName}`);
            renderCurrentView();
        });
    }

    document.getElementById('spa-settings-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const settings = {
            spaName: document.getElementById('settings-spa-name').value.trim(),
            slogan: document.getElementById('settings-spa-slogan').value.trim(),
            phone: document.getElementById('settings-spa-phone').value.trim(),
            address: document.getElementById('settings-spa-address').value.trim(),
            openTime: document.getElementById('settings-open-time').value,
            closeTime: document.getElementById('settings-close-time').value
        };

        window.dataManager.saveSettings(settings);
        showToast('Configuración del spa guardada correctamente');
    });

    document.getElementById('btn-export-json-data')?.addEventListener('click', () => {
        const dataStr = window.dataManager.exportData();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lety_look_backup_${getTodayString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Base de datos exportada en formato JSON');
    });

    document.getElementById('btn-reset-demo-data')?.addEventListener('click', () => {
        if (confirm('¿Deseas restaurar los datos de ejemplo iniciales de LETY LOOK?')) {
            window.dataManager.resetToDefaults();
            showToast('Datos restablecidos a los valores por defecto', 'info');
            renderDashboard();
        }
    });

    // =========================================================================
    // 9. MULTI-THEME COLOR PALETTE SYSTEM
    // =========================================================================
    const savedTheme = localStorage.getItem('lety_look_theme') || 'default';
    applyTheme(savedTheme);

    function applyTheme(themeName) {
        if (themeName === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeName);
        }
        localStorage.setItem('lety_look_theme', themeName);

        // Synchronize with Client App via settings & Cloud Firestore
        try {
            const currentSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
            currentSettings.activeTheme = themeName;
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings));
            if (window.cloudService && window.cloudService.isInitialized) {
                window.cloudService.saveCloudDocument('lety_look', 'settings', currentSettings);
            }
        } catch (e) {
            console.log('Error saving theme to settings:', e);
        }
    }

    const themeSwitcherBtn = document.getElementById('btn-theme-switcher');
    const themeDropdownMenu = document.getElementById('theme-dropdown-menu');

    themeSwitcherBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = themeDropdownMenu.style.display === 'none' || !themeDropdownMenu.style.display;
        themeDropdownMenu.style.display = isHidden ? 'flex' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (themeDropdownMenu && !themeDropdownMenu.contains(e.target) && e.target !== themeSwitcherBtn) {
            themeDropdownMenu.style.display = 'none';
        }
    });

    document.querySelectorAll('.theme-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            applyTheme(theme);
            themeDropdownMenu.style.display = 'none';
            showToast(`Tema visual cambiado a: ${btn.textContent.trim()}`);
        });
    });

    // =========================================================================
    // 10. ADMINISTRATOR SECURITY & ACCESS GATE (PIN PROTECTION)
    // =========================================================================
    const DEFAULT_ADMIN_PIN = 'lety2026';
    const securityGate = document.getElementById('admin-security-gate');
    const adminLayout = document.getElementById('admin-app-layout');
    const pinInput = document.getElementById('admin-pin-input');
    const authError = document.getElementById('admin-auth-error');

    function checkAdminAuth() {
        const isAuth = sessionStorage.getItem('lety_admin_authenticated') === 'true';
        if (isAuth) {
            if (securityGate) securityGate.style.display = 'none';
            if (adminLayout) adminLayout.style.display = 'flex';
        } else {
            if (securityGate) securityGate.style.display = 'flex';
            if (adminLayout) adminLayout.style.display = 'none';
            if (pinInput) {
                pinInput.value = '';
                setTimeout(() => pinInput.focus(), 300);
            }
        }
    }

    checkAdminAuth();

    // Toggle PIN visibility
    document.getElementById('btn-toggle-pin-visibility')?.addEventListener('click', () => {
        if (!pinInput) return;
        const isPassword = pinInput.type === 'password';
        pinInput.type = isPassword ? 'text' : 'password';
        const icon = document.querySelector('#btn-toggle-pin-visibility i');
        if (icon) {
            icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
        }
    });

    // Handle Admin Login Submit
    document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentSavedPin = localStorage.getItem('lety_admin_pin') || DEFAULT_ADMIN_PIN;
        const enteredPin = pinInput ? pinInput.value.trim() : '';

        if (enteredPin === currentSavedPin) {
            if (authError) authError.style.display = 'none';
            sessionStorage.setItem('lety_admin_authenticated', 'true');
            if (securityGate) securityGate.style.display = 'none';
            if (adminLayout) adminLayout.style.display = 'flex';
            showToast('¡Bienvenida Administradora! Panel desbloqueado');
        } else {
            if (authError) authError.style.display = 'block';
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
        }
    });

    // Lock Panel (Logout)
    function lockAdminPanel() {
        sessionStorage.removeItem('lety_admin_authenticated');
        checkAdminAuth();
        showToast('Panel de administración bloqueado con éxito', 'info');
    }

    document.getElementById('sidebar-lock-btn')?.addEventListener('click', lockAdminPanel);
    document.getElementById('topbar-lock-btn')?.addEventListener('click', lockAdminPanel);

    // Change Admin PIN in Settings
    document.getElementById('change-admin-pin-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPinInput = document.getElementById('current-admin-pin');
        const newPinInput = document.getElementById('new-admin-pin');
        const savedPin = localStorage.getItem('lety_admin_pin') || DEFAULT_ADMIN_PIN;

        if (currentPinInput.value.trim() !== savedPin) {
            showToast('La clave actual es incorrecta', 'error');
            return;
        }

        const newPin = newPinInput.value.trim();
        if (newPin.length < 4) {
            showToast('La nueva clave debe tener al menos 4 caracteres', 'error');
            return;
        }

        localStorage.setItem('lety_admin_pin', newPin);
        currentPinInput.value = '';
        newPinInput.value = '';

        // Sync with Cloud Firestore Settings if connected
        try {
            const currentSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
            currentSettings.adminPin = newPin;
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings));
            if (window.cloudService && window.cloudService.isInitialized) {
                window.cloudService.saveCloudDocument('lety_look', 'settings', currentSettings);
            }
        } catch (err) {
            console.log('Error syncing PIN to cloud:', err);
        }

        showToast('¡Clave de administración actualizada con éxito!');
    });

    // Initial load
    switchView('dashboard');
});
