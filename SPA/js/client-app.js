/**
 * LETY LOOK SPA - Mobile Client Application Controller
 * Features: Authentication, Personalized Experience, Appointment Privacy Isolation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Client App State
    const clientState = {
        currentTab: 'tab-explore',
        selectedCategory: 'all',
        
        // Wizard State
        wizardStep: 1,
        selectedService: null,
        selectedStaff: null,
        selectedDate: getTomorrowDateString(),
        selectedTime: null,
        confirmedAppointment: null
    };

    // PWA Service Worker & Android Installation Handler
    let deferredPrompt = null;
    const installBanner = document.getElementById('android-install-banner');
    const installBtn = document.getElementById('btn-trigger-android-install');
    const profileInstallBtn = document.getElementById('btn-profile-install-apk');
    const apkModal = document.getElementById('modal-apk-instructions');
    const closeApkModalBtn = document.getElementById('btn-close-apk-modal');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBanner) installBanner.style.display = 'flex';
    });

    async function triggerApkInstall() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                if (installBanner) installBanner.style.display = 'none';
            }
            deferredPrompt = null;
        } else {
            if (apkModal) apkModal.style.display = 'flex';
        }
    }

    installBtn?.addEventListener('click', triggerApkInstall);
    profileInstallBtn?.addEventListener('click', triggerApkInstall);

    closeApkModalBtn?.addEventListener('click', () => {
        if (apkModal) apkModal.style.display = 'none';
    });

    // Force App Refresh & Cache Clearer
    document.getElementById('btn-force-refresh-client-app')?.addEventListener('click', async () => {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let reg of registrations) {
                await reg.unregister();
            }
        }
        window.dataManager.init();
        window.location.reload();
    });
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    }

    function getTodayDateString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getTomorrowDateString() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
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
        hour = hour ? hour : 12;
        return `${hour}:${minStr} ${ampm}`;
    }

    // =========================================================================
    // 1. AUTHENTICATION & HEADER UI CONTROLLER
    // =========================================================================
    function updateAuthUI() {
        const currentClient = window.dataManager.getCurrentClient();
        const headerBadge = document.getElementById('header-auth-badge');
        const navAccountLabel = document.getElementById('nav-account-label');
        const heroGreeting = document.getElementById('hero-greeting-title');

        if (currentClient) {
            const firstName = currentClient.name.split(' ')[0];
            headerBadge.innerHTML = `
                <div class="header-user-profile-btn" id="btn-header-profile" title="Mi Cuenta">
                    <img src="${currentClient.avatar}" alt="${currentClient.name}" class="header-user-avatar">
                    <span class="header-user-name">${firstName}</span>
                </div>
            `;
            document.getElementById('btn-header-profile')?.addEventListener('click', () => {
                switchTab('tab-account');
            });

            if (navAccountLabel) navAccountLabel.textContent = 'Mi Perfil';
            if (heroGreeting) heroGreeting.textContent = `¡Hola, ${firstName}! ✨ Resalta tu Belleza`;
        } else {
            headerBadge.innerHTML = `
                <button class="btn-book-service" id="btn-header-login" style="padding:0.35rem 0.75rem; font-size:0.75rem;">
                    <i class="fa-solid fa-user"></i> Ingresar
                </button>
            `;
            document.getElementById('btn-header-login')?.addEventListener('click', () => {
                switchTab('tab-account');
            });

            if (navAccountLabel) navAccountLabel.textContent = 'Cuenta';
            if (heroGreeting) heroGreeting.textContent = 'Resalta tu Belleza con los Mejores Expertos';
        }
    }

    // =========================================================================
    // 2. BOTTOM NAVIGATION TAB SWITCHER
    // =========================================================================
    function switchTab(tabId) {
        clientState.currentTab = tabId;

        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-target') === tabId);
        });

        document.querySelectorAll('.tab-content').forEach(tab => {
            if (tab.id === tabId) {
                tab.style.display = 'block';
            } else {
                tab.style.display = 'none';
            }
        });

        // Tab-specific renders
        if (tabId === 'tab-explore') renderExploreTab();
        if (tabId === 'tab-book') renderWizardStep(clientState.wizardStep);
        if (tabId === 'tab-staff') renderStaffDirectory();
        if (tabId === 'tab-my-appointments') renderMyAppointments();
        if (tabId === 'tab-account') renderAccountTab();

        updateAuthUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) switchTab(target);
        });
    });

    document.getElementById('btn-hero-start-booking')?.addEventListener('click', () => {
        clientState.wizardStep = 1;
        switchTab('tab-book');
    });

    // =========================================================================
    // 3. EXPLORE SERVICES TAB
    // =========================================================================
    function renderExploreTab() {
        const container = document.getElementById('client-services-list');
        container.innerHTML = '';

        let services = window.dataManager.getServices();
        if (clientState.selectedCategory !== 'all') {
            services = services.filter(s => s.category === clientState.selectedCategory);
        }

        const categoryLabels = {
            manicura: 'Manicura',
            pedicura: 'Pedicura',
            peluqueria: 'Peluquería',
            tintura: 'Tintura y Color'
        };

        services.forEach(srv => {
            const card = document.createElement('div');
            card.className = 'client-srv-card';

            const imgMarkup = srv.image
                ? `<img src="${srv.image}" alt="${srv.name}" onerror="this.outerHTML='<div style=\\'height:140px; background:linear-gradient(135deg, #fce7eb, #f9d3dc); display:flex; align-items:center; justify-content:center; color:var(--primary); font-size:2.5rem;\\'><i class=\\'fa-solid fa-spa\\'></i></div>'">`
                : `<div style="height:140px; background:linear-gradient(135deg, #fce7eb, #f9d3dc); display:flex; align-items:center; justify-content:center; color:var(--primary); font-size:2.5rem;"><i class="fa-solid fa-spa"></i></div>`;

            card.innerHTML = `
                <div class="client-srv-img-wrap">
                    ${imgMarkup}
                    <span class="client-srv-category-tag">${categoryLabels[srv.category] || srv.category}</span>
                    <span class="client-srv-duration-tag"><i class="fa-regular fa-clock"></i> ${srv.duration} min</span>
                </div>
                <div class="client-srv-content">
                    <h4 class="client-srv-title">${srv.name}</h4>
                    <p class="client-srv-desc">${srv.description}</p>
                    <div class="client-srv-footer">
                        <div class="client-srv-price">${formatCurrency(srv.price)}</div>
                        <button class="btn-book-service btn-start-srv-booking" data-id="${srv.id}">
                            <span>Reservar</span>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Fast book button listener
        container.querySelectorAll('.btn-start-srv-booking').forEach(btn => {
            btn.addEventListener('click', () => {
                const srvId = btn.getAttribute('data-id');
                const srv = window.dataManager.getServiceById(srvId);
                if (srv) {
                    clientState.selectedService = srv;
                    clientState.wizardStep = 2; // Jump straight to choosing specialist
                    switchTab('tab-book');
                }
            });
        });
    }

    // Category slider clicks
    document.querySelectorAll('#client-category-slider .cat-btn-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#client-category-slider .cat-btn-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            clientState.selectedCategory = pill.getAttribute('data-cat');
            renderExploreTab();
        });
    });

    // =========================================================================
    // 4. BOOKING WIZARD (STEP-BY-STEP)
    // =========================================================================
    function renderWizardStep(stepNumber) {
        clientState.wizardStep = stepNumber;

        // Update step circles
        [1, 2, 3, 4].forEach(n => {
            const circle = document.getElementById(`circle-step-${n}`);
            if (circle) {
                circle.classList.toggle('active', n === stepNumber);
                circle.classList.toggle('completed', n < stepNumber);
            }
        });

        // Show corresponding step card
        document.querySelectorAll('.step-card').forEach(card => card.classList.remove('active'));
        const activeCard = document.getElementById(`wizard-step-${stepNumber}`);
        if (activeCard) activeCard.classList.add('active');

        // Logic per step
        if (stepNumber === 1) {
            renderWizardStep1();
        } else if (stepNumber === 2) {
            renderWizardStep2();
        } else if (stepNumber === 3) {
            renderWizardStep3();
        } else if (stepNumber === 4) {
            renderWizardStep4();
        }
    }

    // Step 1: Select Service
    function renderWizardStep1() {
        const list = document.getElementById('wizard-services-list');
        list.innerHTML = '';
        const services = window.dataManager.getServices();

        services.forEach(srv => {
            const isSelected = clientState.selectedService && clientState.selectedService.id === srv.id;
            const opt = document.createElement('div');
            opt.className = `staff-select-card ${isSelected ? 'selected' : ''}`;
            opt.innerHTML = `
                <div style="flex:1;">
                    <div style="font-size:0.95rem; font-weight:700; color:var(--text-primary);">${srv.name}</div>
                    <div style="font-size:0.78rem; color:var(--text-secondary);"><i class="fa-regular fa-clock"></i> ${srv.duration} min &bull; <strong>${formatCurrency(srv.price)}</strong></div>
                </div>
                <div style="color:var(--primary); font-size:1.1rem;">
                    <i class="fa-solid ${isSelected ? 'fa-circle-check' : 'fa-circle-chevron-right'}"></i>
                </div>
            `;
            opt.addEventListener('click', () => {
                clientState.selectedService = srv;
                renderWizardStep(2);
            });
            list.appendChild(opt);
        });
    }

    // Step 2: Select Specialist
    function renderWizardStep2() {
        const list = document.getElementById('wizard-staff-list');
        list.innerHTML = '';

        if (!clientState.selectedService) {
            renderWizardStep(1);
            return;
        }

        let availableStaff = window.dataManager.getStaff().filter(st => 
            st.specialties.includes(clientState.selectedService.category) && st.status === 'active'
        );

        if (availableStaff.length === 0) {
            availableStaff = window.dataManager.getStaff().filter(st => st.status === 'active');
        }

        const anyOption = document.createElement('div');
        const isAnySelected = clientState.selectedStaff === null;
        anyOption.className = `staff-select-card ${isAnySelected ? 'selected' : ''}`;
        anyOption.innerHTML = `
            <div style="width:46px; height:46px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div class="staff-select-info" style="flex:1;">
                <h4>Cualquier Especialista Disponible</h4>
                <p>Asignar automáticamente el profesional más idóneo</p>
            </div>
            <div style="color:var(--primary); font-size:1.1rem;">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        `;
        anyOption.addEventListener('click', () => {
            clientState.selectedStaff = availableStaff[0] || window.dataManager.getStaff()[0];
            renderWizardStep(3);
        });
        list.appendChild(anyOption);

        availableStaff.forEach(st => {
            const isSelected = clientState.selectedStaff && clientState.selectedStaff.id === st.id;
            const opt = document.createElement('div');
            opt.className = `staff-select-card ${isSelected ? 'selected' : ''}`;
            opt.innerHTML = `
                <img src="${st.avatar}" alt="${st.name}" class="staff-select-avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60'">
                <div class="staff-select-info" style="flex:1;">
                    <h4>${st.name}</h4>
                    <p>${st.title}</p>
                </div>
                <div style="color:var(--primary); font-size:1.1rem;">
                    <i class="fa-solid fa-chevron-right"></i>
                </div>
            `;
            opt.addEventListener('click', () => {
                clientState.selectedStaff = st;
                renderWizardStep(3);
            });
            list.appendChild(opt);
        });
    }

    // Step 3: Date & Time
    function renderWizardStep3() {
        const dateInput = document.getElementById('wizard-date-input');
        const slotsGrid = document.getElementById('wizard-slots-grid');

        dateInput.min = getTodayDateString();
        if (!dateInput.value) {
            dateInput.value = clientState.selectedDate || getTomorrowDateString();
        }
        clientState.selectedDate = dateInput.value;

        dateInput.onchange = () => {
            clientState.selectedDate = dateInput.value;
            clientState.selectedTime = null;
            generateTimeSlots();
        };

        generateTimeSlots();

        function generateTimeSlots() {
            slotsGrid.innerHTML = '';
            
            // Validate working days of the selected specialist
            const dayOfWeek = new Date(clientState.selectedDate + 'T00:00:00').getDay();
            const workingDays = clientState.selectedStaff?.workingDays || [1, 2, 3, 4, 5, 6];

            if (!workingDays.includes(dayOfWeek)) {
                slotsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align:center; padding: 2rem 1rem; color: var(--text-secondary); background: var(--bg-subtle); border-radius: var(--radius-md);">
                        <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem; display:block;"></i>
                        <strong>${clientState.selectedStaff.name} no labora este día</strong>
                        <p style="font-size: 0.78rem; margin-top: 0.25rem;">Por favor selecciona otra fecha o cambia de profesional para continuar.</p>
                    </div>
                `;
                return;
            }

            const allAppointments = window.dataManager.getAppointments();
            const bookedTimes = allAppointments
                .filter(a => a.date === clientState.selectedDate && a.staffId === clientState.selectedStaff?.id && a.status !== 'cancelled')
                .map(a => a.time);

            const possibleTimes = [
                '09:00', '09:45', '10:30', '11:15', '12:00', 
                '13:00', '14:00', '14:45', '15:30', '16:15', 
                '17:00', '17:45', '18:30', '19:15'
            ];

            possibleTimes.forEach(timeStr => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'client-slot-btn';
                btn.textContent = formatTime12h(timeStr);

                const isBooked = bookedTimes.includes(timeStr);
                if (isBooked) {
                    btn.disabled = true;
                    btn.title = 'Horario no disponible';
                } else {
                    if (clientState.selectedTime === timeStr) {
                        btn.classList.add('selected');
                    }
                    btn.addEventListener('click', () => {
                        clientState.selectedTime = timeStr;
                        document.querySelectorAll('.client-slot-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        setTimeout(() => renderWizardStep(4), 180);
                    });
                }
                slotsGrid.appendChild(btn);
            });
        }
    }

    // Step 4: Summary & Client Information (Autofilled if logged in)
    function renderWizardStep4() {
        if (!clientState.selectedService || !clientState.selectedStaff || !clientState.selectedDate || !clientState.selectedTime) {
            renderWizardStep(1);
            return;
        }

        document.getElementById('summary-service-name').textContent = clientState.selectedService.name;
        document.getElementById('summary-staff-name').textContent = clientState.selectedStaff.name;
        document.getElementById('summary-datetime').textContent = `${formatDateDisplay(clientState.selectedDate)} a las ${formatTime12h(clientState.selectedTime)}`;
        document.getElementById('summary-price').textContent = formatCurrency(clientState.selectedService.price);

        // Autofill if logged in
        const currentClient = window.dataManager.getCurrentClient();
        if (currentClient) {
            document.getElementById('wizard-client-name').value = currentClient.name;
            document.getElementById('wizard-client-phone').value = currentClient.phone;
            document.getElementById('wizard-client-email').value = currentClient.email;
        }
    }

    document.querySelectorAll('.btn-wizard-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStep = parseInt(btn.getAttribute('data-prev'), 10);
            renderWizardStep(prevStep);
        });
    });

    // Submit booking form
    document.getElementById('wizard-confirm-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('wizard-client-name').value.trim();
        const clientPhone = document.getElementById('wizard-client-phone').value.trim();
        const clientEmail = document.getElementById('wizard-client-email').value.trim();
        const clientNotes = document.getElementById('wizard-client-notes').value.trim();

        if (!clientName || !clientPhone) {
            alert('Por favor ingresa tu nombre y número de WhatsApp');
            return;
        }

        const currentClient = window.dataManager.getCurrentClient();

        const newAppointment = {
            id: 'apt-cli-' + Date.now(),
            clientId: currentClient ? currentClient.id : undefined,
            clientName,
            clientPhone,
            clientEmail: clientEmail || (currentClient ? currentClient.email : ''),
            serviceId: clientState.selectedService.id,
            serviceName: clientState.selectedService.name,
            staffId: clientState.selectedStaff.id,
            staffName: clientState.selectedStaff.name,
            date: clientState.selectedDate,
            time: clientState.selectedTime,
            duration: clientState.selectedService.duration,
            price: clientState.selectedService.price,
            status: 'confirmed',
            notes: clientNotes ? `[App Móvil] ${clientNotes}` : '[App Móvil]'
        };

        // If user is not logged in but provided name/phone/email, register or link seamlessly
        if (!currentClient && clientEmail) {
            // Check if existing
            let client = window.dataManager.getClientByEmailOrPhone(clientEmail) || window.dataManager.getClientByEmailOrPhone(clientPhone);
            if (!client) {
                const regRes = window.dataManager.registerClient({
                    name: clientName,
                    phone: clientPhone,
                    email: clientEmail,
                    password: '123'
                });
                if (regRes.success) {
                    newAppointment.clientId = regRes.client.id;
                }
            } else {
                newAppointment.clientId = client.id;
                window.dataManager.setCurrentClient(client);
            }
            updateAuthUI();
        }

        // Save in global database
        window.dataManager.saveAppointment(newAppointment);
        clientState.confirmedAppointment = newAppointment;

        // Show Success Ticket
        showSuccessTicket(newAppointment);
    });

    function showSuccessTicket(apt) {
        document.querySelectorAll('.step-card').forEach(card => card.classList.remove('active'));
        const successCard = document.getElementById('wizard-step-success');
        successCard.classList.add('active');

        const detailsEl = document.getElementById('success-ticket-details');
        detailsEl.innerHTML = `
            <div class="ticket-row">
                <span class="ticket-label" style="color:#475569; font-weight:700;">Cliente:</span>
                <span class="ticket-val" style="color:#0f172a; font-weight:800;">${apt.clientName}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label" style="color:#475569; font-weight:700;">Servicio:</span>
                <span class="ticket-val" style="color:var(--primary); font-weight:800;">${apt.serviceName}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label" style="color:#475569; font-weight:700;">Especialista:</span>
                <span class="ticket-val" style="color:#b45309; font-weight:800;">${apt.staffName}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label" style="color:#475569; font-weight:700;">Fecha y Hora:</span>
                <span class="ticket-val" style="color:#0f172a; font-weight:800;">${formatDateDisplay(apt.date)} &bull; ${formatTime12h(apt.time)}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label" style="color:#475569; font-weight:700;">Duración:</span>
                <span class="ticket-val" style="color:#0f172a; font-weight:800;">${apt.duration} minutos</span>
            </div>
            <div class="ticket-row" style="border-bottom:none; padding-top:0.35rem;">
                <span class="ticket-label" style="color:#0f172a; font-weight:800; font-size:0.95rem;">Total a Pagar:</span>
                <span class="ticket-val" style="font-size:1.3rem; color:#0f172a; font-weight:900;">${formatCurrency(apt.price)}</span>
            </div>
        `;

        document.getElementById('btn-send-whatsapp-booking').onclick = () => {
            sendClientWhatsAppMessage(apt);
        };

        const staffBtn = document.getElementById('btn-send-whatsapp-staff');
        if (staffBtn) {
            const staffNameShort = apt.staffName.split(' ')[0];
            document.getElementById('label-notify-staff-btn').textContent = `Notificar a ${staffNameShort} por WhatsApp`;
            staffBtn.onclick = () => {
                sendSpecialistWhatsAppNotification(apt);
            };
        }

        document.getElementById('btn-view-my-appointments-after-booking').onclick = () => {
            switchTab('tab-my-appointments');
        };
    }

    function sendClientWhatsAppMessage(apt) {
        const settings = window.dataManager.getSettings();
        const spaWhatsApp = settings.whatsapp || '573138869676';

        const message = `✨ *NUEVA RESERVA DESDE LA APP - SPA LETY LOOK* ✨\n\n` +
            `¡Hola Lety Look! Acabo de agendar mi cita desde su App Móvil con los siguientes detalles:\n\n` +
            `👤 *Cliente:* ${apt.clientName}\n` +
            `📱 *WhatsApp:* ${apt.clientPhone}\n` +
            `💅 *Servicio:* ${apt.serviceName}\n` +
            `👩‍🎨 *Especialista:* ${apt.staffName}\n` +
            `📅 *Fecha:* ${formatDateDisplay(apt.date)}\n` +
            `⏰ *Hora:* ${formatTime12h(apt.time)}\n` +
            `💰 *Total:* ${formatCurrency(apt.price)}\n\n` +
            `¡Por favor confírmenme cuando reciban este mensaje! Gracias 💕`;

        const waUrl = `https://wa.me/${spaWhatsApp}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    }

    function sendSpecialistWhatsAppNotification(apt) {
        const staff = window.dataManager.getStaffById(apt.staffId);
        const cleanPhone = staff && staff.phone ? staff.phone.replace(/\D/g, '') : '573138869676';

        const message = `🌸 *NUEVA CITA ASIGNADA - LETY LOOK SPA* 🌸\n\n` +
            `¡Hola *${apt.staffName}*! Se te ha asignado una nueva cita desde la App de Clientes:\n\n` +
            `👤 *Cliente:* ${apt.clientName}\n` +
            `📱 *WhatsApp Cliente:* ${apt.clientPhone}\n` +
            `💅 *Tratamiento:* ${apt.serviceName}\n` +
            `📅 *Fecha:* ${formatDateDisplay(apt.date)}\n` +
            `⏰ *Hora:* ${formatTime12h(apt.time)} (${apt.duration} min)\n` +
            `💰 *Valor:* ${formatCurrency(apt.price)}\n\n` +
            `¡Prepárate para consentir a tu clienta! ✨`;

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    }

    // =========================================================================
    // 5. SPECIALISTS DIRECTORY TAB
    // =========================================================================
    function renderStaffDirectory() {
        const container = document.getElementById('client-staff-directory');
        container.innerHTML = '';

        const staffList = window.dataManager.getStaff().filter(s => s.status === 'active');
        const specLabels = { manicura: 'Manicura', pedicura: 'Pedicura', peluqueria: 'Peluquería', tintura: 'Tintura' };

        staffList.forEach(st => {
            const card = document.createElement('div');
            card.className = 'client-srv-card';
            card.style.padding = '1.25rem';

            const specialtiesBadges = st.specialties.map(spec => 
                `<span style="background:var(--bg-subtle); color:var(--text-secondary); font-size:0.72rem; font-weight:700; padding:0.2rem 0.5rem; border-radius:var(--radius-full); margin-right:4px;">${specLabels[spec] || spec}</span>`
            ).join('');

            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:0.75rem;">
                    <img src="${st.avatar}" alt="${st.name}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-light);">
                    <div>
                        <h4 style="font-size:1.05rem; font-weight:700;">${st.name}</h4>
                        <span style="font-size:0.78rem; color:var(--gold); font-weight:700;">${st.title}</span>
                    </div>
                </div>
                <div style="margin-bottom:0.6rem;">${specialtiesBadges}</div>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem; line-height:1.4;">${st.bio || ''}</p>
                <button class="btn-hero-book btn-book-with-staff" data-id="${st.id}" style="width:100%; justify-content:center; padding:0.55rem;">
                    <i class="fa-solid fa-calendar-check"></i> Agendar con ${st.name.split(' ')[0]}
                </button>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.btn-book-with-staff').forEach(btn => {
            btn.addEventListener('click', () => {
                const staffId = btn.getAttribute('data-id');
                const st = window.dataManager.getStaffById(staffId);
                if (st) {
                    clientState.selectedStaff = st;
                    clientState.wizardStep = 1;
                    switchTab('tab-book');
                }
            });
        });
    }

    // =========================================================================
    // 6. MIS CITAS (STRICT PRIVACY - ONLY CLIENT'S OWN APPOINTMENTS)
    // =========================================================================
    function renderMyAppointments() {
        const container = document.getElementById('client-my-appointments-list');
        container.innerHTML = '';

        const currentClient = window.dataManager.getCurrentClient();

        // If not logged in, prompt to login/register to protect privacy
        if (!currentClient) {
            container.innerHTML = `
                <div style="text-align:center; padding:2.5rem 1rem; background:#fff; border-radius:var(--radius-lg); border:1px solid var(--border-color); box-shadow:var(--shadow-card);">
                    <i class="fa-solid fa-lock" style="font-size:2.5rem; margin-bottom:1rem; color:var(--primary); display:block;"></i>
                    <h4 style="font-family:'Playfair Display', serif; font-size:1.25rem; margin-bottom:0.4rem;">Acceso Privado a tus Citas</h4>
                    <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:1.5rem; line-height:1.4;">
                        Para proteger tu privacidad y mostrar únicamente tus citas agendadas, por favor inicia sesión o crea tu cuenta.
                    </p>
                    <button class="btn-hero-book" id="btn-login-to-view-apts" style="margin:0 auto; padding:0.75rem 1.5rem;">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Iniciar Sesión / Registrarme
                    </button>
                </div>
            `;
            container.querySelector('#btn-login-to-view-apts')?.addEventListener('click', () => {
                switchTab('tab-account');
            });
            return;
        }

        // Get strictly this client's appointments
        const myAppointments = window.dataManager.getClientAppointments(currentClient.id, currentClient.email, currentClient.phone);

        if (myAppointments.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:3rem 1rem; color:var(--text-light); background:#fff; border-radius:var(--radius-lg); border:1px solid var(--border-color);">
                    <i class="fa-solid fa-calendar-xmark" style="font-size:2.5rem; margin-bottom:0.75rem; display:block; color:var(--primary);"></i>
                    <h4 style="font-family:'Playfair Display', serif; font-size:1.2rem; color:var(--text-primary); margin-bottom:0.4rem;">No tienes citas activas</h4>
                    <p style="font-size:0.82rem; margin-bottom:1.25rem;">¡Consiéntete hoy agendando tu primer servicio en LETY LOOK!</p>
                    <button class="btn-hero-book" id="btn-empty-book-now" style="margin:0 auto;">Agendar Cita Ahora</button>
                </div>
            `;
            container.querySelector('#btn-empty-book-now')?.addEventListener('click', () => {
                clientState.wizardStep = 1;
                switchTab('tab-book');
            });
            return;
        }

        const statusBadges = {
            confirmed: '<span class="history-status-badge" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;">Confirmada</span>',
            pending: '<span class="history-status-badge" style="background:#fffbeb; color:#92400e; border:1px solid #fde68a;">Pendiente</span>',
            completed: '<span class="history-status-badge" style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe;">Completada</span>',
            cancelled: '<span class="history-status-badge" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca;">Cancelada</span>'
        };

        myAppointments.forEach(apt => {
            const card = document.createElement('div');
            card.className = 'client-history-card';
            card.innerHTML = `
                <div class="history-card-header">
                    <span style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);"><i class="fa-regular fa-calendar"></i> ${formatDateDisplay(apt.date)}</span>
                    ${statusBadges[apt.status] || ''}
                </div>
                <h4 style="font-size:1rem; font-weight:700; color:var(--primary);">${apt.serviceName}</h4>
                <div style="font-size:0.82rem; color:var(--text-secondary);">
                    <div><i class="fa-regular fa-clock"></i> Hora: <strong>${formatTime12h(apt.time)}</strong> (${apt.duration} min)</div>
                    <div><i class="fa-solid fa-user"></i> Especialista: <strong>${apt.staffName}</strong></div>
                    <div><i class="fa-solid fa-tag"></i> Total: <strong>${formatCurrency(apt.price)}</strong></div>
                </div>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                    <button class="btn-client-wa btn-my-apt-wa" data-id="${apt.id}" style="flex:1; padding:0.55rem; font-size:0.82rem;">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp Spa
                    </button>
                    ${apt.status !== 'cancelled' ? `
                        <button class="btn-book-service btn-my-apt-cancel" data-id="${apt.id}" style="color:#ef4444; border-color:#fca5a5; background:#fff;">
                            Cancelar
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });

        // WhatsApp button listener
        container.querySelectorAll('.btn-my-apt-wa').forEach(btn => {
            btn.addEventListener('click', () => {
                const aptId = btn.getAttribute('data-id');
                const apt = window.dataManager.getAppointmentById(aptId);
                if (apt) sendClientWhatsAppMessage(apt);
            });
        });

        // Cancel button listener
        container.querySelectorAll('.btn-my-apt-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                const aptId = btn.getAttribute('data-id');
                if (confirm('¿Deseas cancelar esta cita?')) {
                    window.dataManager.updateAppointmentStatus(aptId, 'cancelled');
                    renderMyAppointments();
                }
            });
        });
    }

    // =========================================================================
    // 7. ACCOUNT TAB (LOGIN, REGISTER, PROFILE)
    // =========================================================================
    function renderAccountTab() {
        const currentClient = window.dataManager.getCurrentClient();
        const unauthView = document.getElementById('auth-unauthenticated-view');
        const authView = document.getElementById('auth-authenticated-view');
        const errorBox = document.getElementById('auth-error-box');
        errorBox.style.display = 'none';

        if (currentClient) {
            unauthView.style.display = 'none';
            authView.style.display = 'block';

            document.getElementById('profile-name-display').textContent = currentClient.name;
            document.getElementById('profile-email-display').textContent = currentClient.email;
            document.getElementById('profile-phone-display').textContent = currentClient.phone;
            document.getElementById('profile-avatar-display').src = currentClient.avatar;

            const myApts = window.dataManager.getClientAppointments(currentClient.id, currentClient.email, currentClient.phone);
            document.getElementById('profile-total-appointments').textContent = `${myApts.length} cita(s)`;
        } else {
            unauthView.style.display = 'block';
            authView.style.display = 'none';
        }
    }

    // Segmented tab switch between Login and Register
    document.getElementById('btn-tab-login')?.addEventListener('click', () => {
        document.getElementById('btn-tab-login').classList.add('active');
        document.getElementById('btn-tab-register').classList.remove('active');
        document.getElementById('form-login-container').style.display = 'block';
        document.getElementById('form-register-container').style.display = 'none';
        document.getElementById('auth-error-box').style.display = 'none';
    });

    document.getElementById('btn-tab-register')?.addEventListener('click', () => {
        document.getElementById('btn-tab-register').classList.add('active');
        document.getElementById('btn-tab-login').classList.remove('active');
        document.getElementById('form-login-container').style.display = 'none';
        document.getElementById('form-register-container').style.display = 'block';
        document.getElementById('auth-error-box').style.display = 'none';
    });

    // Image compression utility
    function compressImageFile(file, maxWidth = 250, maxHeight = 250, quality = 0.85) {
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

    // Avatar upload on Profile
    document.getElementById('client-avatar-file-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const currentClient = window.dataManager.getCurrentClient();
        if (!currentClient) return;

        try {
            const compressedBase64 = await compressImageFile(file);
            const res = window.dataManager.updateClientAvatar(currentClient.id, compressedBase64);
            if (res.success) {
                updateAuthUI();
                alert('¡Foto de perfil actualizada con éxito!');
            }
        } catch (err) {
            alert('Error al procesar la imagen seleccionada.');
        }
    });

    // Register avatar preview
    let regAvatarDataUrl = null;
    document.getElementById('reg-avatar-file')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            regAvatarDataUrl = await compressImageFile(file);
            const previewEl = document.getElementById('reg-avatar-preview');
            if (previewEl) previewEl.src = regAvatarDataUrl;
        } catch (err) {
            console.error('Avatar preview error:', err);
        }
    });

    // Login Form Submit
    document.getElementById('client-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;
        const errorBox = document.getElementById('auth-error-box');

        const result = window.dataManager.loginClient(identifier, password);
        if (result.success) {
            errorBox.style.display = 'none';
            document.getElementById('client-login-form').reset();
            updateAuthUI();
            switchTab('tab-my-appointments');
        } else {
            errorBox.textContent = result.message;
            errorBox.style.display = 'block';
        }
    });

    // Register Form Submit
    document.getElementById('client-register-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const errorBox = document.getElementById('auth-error-box');

        if (!name || !phone || !email || !password) {
            errorBox.textContent = 'Por favor completa todos los campos requeridos.';
            errorBox.style.display = 'block';
            return;
        }

        const result = window.dataManager.registerClient({ 
            name, 
            phone, 
            email, 
            password,
            avatar: regAvatarDataUrl || undefined 
        });

        if (result.success) {
            errorBox.style.display = 'none';
            document.getElementById('client-register-form').reset();
            regAvatarDataUrl = null;
            updateAuthUI();
            alert(`¡Bienvenida a LETY LOOK, ${name.split(' ')[0]}! Tu cuenta ha sido creada con éxito.`);
            switchTab('tab-explore');
        } else {
            errorBox.textContent = result.message;
            errorBox.style.display = 'block';
        }
    });

    // Profile buttons
    document.getElementById('btn-profile-go-to-appointments')?.addEventListener('click', () => {
        switchTab('tab-my-appointments');
    });

    document.getElementById('btn-client-logout')?.addEventListener('click', () => {
        if (confirm('¿Deseas cerrar tu sesión?')) {
            window.dataManager.logoutClient();
            updateAuthUI();
            switchTab('tab-explore');
        }
    });

    // Theme controlled exclusively by Admin Panel Settings
    const savedTheme = localStorage.getItem('lety_look_theme') || 'default';
    applyClientTheme(savedTheme);

    function applyClientTheme(themeName) {
        if (!themeName || themeName === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeName);
        }
    }

    // Live sync theme if admin changes it in real time via Cloud Firestore
    if (window.cloudService) {
        window.cloudService.onSync((collectionName) => {
            if (collectionName === 'settings') {
                try {
                    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
                    if (settings.activeTheme) {
                        applyClientTheme(settings.activeTheme);
                        localStorage.setItem('lety_look_theme', settings.activeTheme);
                    }
                } catch (e) {
                    console.log('Error updating live theme:', e);
                }
            }
        });
    }

    // Copy Spa Address Action
    document.getElementById('btn-copy-address')?.addEventListener('click', () => {
        const address = 'Calle 139 Sur #49-42, Caldas, Antioquia';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(address).then(() => {
                const btn = document.getElementById('btn-copy-address');
                if (btn) {
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check" style="color:#10b981;"></i> <span>¡Copiada!</span>';
                    setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
                }
            }).catch(() => {
                prompt('Dirección del Spa:', address);
            });
        } else {
            prompt('Dirección del Spa:', address);
        }
    });

    // Initial load: Clean guest state unless client specifically logs in
    updateAuthUI();
    switchTab('tab-explore');
});
