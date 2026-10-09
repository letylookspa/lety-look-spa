/**
 * Data Storage & Seed Module for LETY LOOK SPA
 */

const STORAGE_KEYS = window.STORAGE_KEYS || {
    SERVICES: 'lety_look_services',
    STAFF: 'lety_look_staff',
    APPOINTMENTS: 'lety_look_appointments',
    SETTINGS: 'lety_look_settings',
    CLIENTS: 'lety_look_clients',
    CURRENT_CLIENT: 'lety_look_current_client'
};
window.STORAGE_KEYS = STORAGE_KEYS;

const DEFAULT_CATEGORIES = [
    { id: 'manicura', name: 'Manicura', icon: 'fa-hand-sparkles', description: 'Cuidado, esculpido y diseño de uñas de manos' },
    { id: 'pedicura', name: 'Pedicura', icon: 'fa-shoe-prints', description: 'Tratamientos de pies, exfoliación y esmaltado' },
    { id: 'peluqueria', name: 'Peluquería', icon: 'fa-scissors', description: 'Cortes modernos, peinados, brushing y alisados' },
    { id: 'tintura', name: 'Tintura y Color', icon: 'fa-wand-magic-sparkles', description: 'Coloración completa, mechas, balayage y matices' }
];

const DEFAULT_SERVICES = [
    // Manicura
    {
        id: 'srv-1',
        name: 'Manicura Semipermanente Clásica',
        category: 'manicura',
        duration: 45,
        price: 35000,
        description: 'Limpieza de cutículas, limado anatómico, esmaltado en gel de alta duración y masaje hidratante.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: 'srv-2',
        name: 'Manicura Rusa & Kapping Gel',
        category: 'manicura',
        duration: 75,
        price: 55000,
        description: 'Técnica con torno para acabado limpio y baño de gel reforzador sobre uña natural.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: 'srv-3',
        name: 'Uñas Acrílicas Esculpidas + Nail Art',
        category: 'manicura',
        duration: 90,
        price: 75000,
        description: 'Extensión escultural con acrílico premium y diseño personalizado a mano alzada.',
        popular: false,
        image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&auto=format&fit=crop&q=60'
    },

    // Pedicura
    {
        id: 'srv-4',
        name: 'Pedicura Spa Hidratante Profunda',
        category: 'pedicura',
        duration: 60,
        price: 45000,
        description: 'Baño de sales aromáticas, exfoliación botánica con toallas tibias, remoción de durezas y esmaltado.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: 'srv-5',
        name: 'Pedicura Semipermanente Express',
        category: 'pedicura',
        duration: 45,
        price: 38000,
        description: 'Perfilado rápido, embellecimiento y esmalte semipermanente resistente al agua y calzado.',
        popular: false,
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60'
    },

    // Peluquería
    {
        id: 'srv-6',
        name: 'Corte de Dama & Brushing con Estilo',
        category: 'peluqueria',
        duration: 60,
        price: 40000,
        description: 'Diagnóstico capilar, lavado con masaje capilar relajante, corte según visagismo y peinado.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: 'srv-7',
        name: 'Alisado de Keratina Orgánica & Botox',
        category: 'peluqueria',
        duration: 120,
        price: 120000,
        description: 'Reconstrucción de fibra capilar con brillo espejo, control de frizz y lacio sedoso por 3 a 4 meses.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: 'srv-8',
        name: 'Peinado Social & Ondas al Agua',
        category: 'peluqueria',
        duration: 50,
        price: 48000,
        description: 'Peinados de gala, ondas glamorosas o recogidos para fiestas y eventos especiales.',
        popular: false,
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&auto=format&fit=crop&q=60'
    },

    // Tintura
    {
        id: 'srv-9',
        name: 'Balayage Deluxe & Iluminación Solar',
        category: 'tintura',
        duration: 180,
        price: 160000,
        description: 'Degradado artesanal sin efecto raíz, decoloración con Plex protector, matizado y mascarilla nutritiva.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: 'srv-10',
        name: 'Coloración Completa y Baño de Brillo',
        category: 'tintura',
        duration: 90,
        price: 85000,
        description: 'Aplicación de tinte profesional con cobertura total de canas e hidratación selladora de cutícula.',
        popular: false,
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: 'srv-11',
        name: 'Mechas Babylights & Tonalización',
        category: 'tintura',
        duration: 150,
        price: 135000,
        description: 'Microreflejos finos distribuidos de forma natural para aportar máxima luz y dimensionalidad al cabello.',
        popular: false,
        image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500&auto=format&fit=crop&q=60'
    }
];

const DEFAULT_STAFF = [
    {
        id: 'stf-1',
        name: 'Leticia "Lety" Morales',
        title: 'Master Stylist & Directora',
        specialties: ['peluqueria', 'tintura'],
        phone: '+57 310 987 6543',
        email: 'lety@letylookspa.com',
        color: '#E06D85',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=60',
        workingDays: [1, 2, 3, 4, 5, 6],
        startTime: '09:00',
        endTime: '19:00',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        bio: 'Especialista en colorimetría avanzada, balayage y diseño de corte con más de 12 años transformando estilos.',
        status: 'active'
    },
    {
        id: 'stf-2',
        name: 'Camila Ríos',
        title: 'Nail Artist & Esteticista',
        specialties: ['manicura', 'pedicura'],
        phone: '+57 312 456 7890',
        email: 'camila.rios@letylookspa.com',
        color: '#9333EA',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60',
        workingDays: [1, 2, 3, 4, 5, 6],
        startTime: '08:30',
        endTime: '18:00',
        lunchStart: '12:30',
        lunchEnd: '13:30',
        bio: 'Experta en manicura rusa, kapping gel, nail art a mano alzada y terapias relajantes de pedicura spa.',
        status: 'active'
    },
    {
        id: 'stf-3',
        name: 'Valentina Gómez',
        title: 'Colorista & Tratamientos Capilares',
        specialties: ['tintura', 'peluqueria'],
        phone: '+57 315 678 9012',
        email: 'valentina.g@letylookspa.com',
        color: '#F59E0B',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60',
        workingDays: [2, 3, 4, 5, 6],
        startTime: '10:00',
        endTime: '19:30',
        lunchStart: '14:00',
        lunchEnd: '15:00',
        bio: 'Certificada internacionalmente en técnicas de balayage brasileño y tratamientos de alisados reconstructivos.',
        status: 'active'
    },
    {
        id: 'stf-4',
        name: 'Sofía Herrera',
        title: 'Especialista en Manicura & Spa de Pies',
        specialties: ['manicura', 'pedicura'],
        phone: '+57 318 234 5678',
        email: 'sofia.herrera@letylookspa.com',
        color: '#10B981',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60',
        workingDays: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:30',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        bio: 'Apasionada por el cuidado de la salud ungueal, técnicas de acrílico ultra ligeras y esmaltados de larga duración.',
        status: 'active'
    }
];

const DEFAULT_CLIENTS = [
    {
        id: 'cli-1',
        name: 'María Fernanda Ruiz',
        email: 'mafe.ruiz@gmail.com',
        phone: '3001234567',
        password: '123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
        createdAt: '2026-08-01'
    },
    {
        id: 'cli-2',
        name: 'Diana Marcela Torres',
        email: 'diana.torres@outlook.com',
        phone: '3119871122',
        password: '123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60',
        createdAt: '2026-08-10'
    },
    {
        id: 'cli-3',
        name: 'Valentina Martínez',
        email: 'valentina@gmail.com',
        phone: '3109876543',
        password: '123',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=60',
        createdAt: '2026-08-15'
    }
];

function getFormattedDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const DEFAULT_APPOINTMENTS = [
    {
        id: 'apt-101',
        clientId: 'cli-1',
        clientName: 'María Fernanda Ruiz',
        clientPhone: '3001234567',
        clientEmail: 'mafe.ruiz@gmail.com',
        serviceId: 'srv-9',
        serviceName: 'Balayage Deluxe & Iluminación Solar',
        staffId: 'stf-1',
        staffName: 'Leticia "Lety" Morales',
        date: getFormattedDate(0),
        time: '09:30',
        duration: 180,
        price: 160000,
        status: 'confirmed',
        notes: 'Desea matiz beige dorado. Trae foto de referencia.'
    },
    {
        id: 'apt-102',
        clientId: 'cli-2',
        clientName: 'Diana Marcela Torres',
        clientPhone: '3119871122',
        clientEmail: 'diana.torres@outlook.com',
        serviceId: 'srv-1',
        serviceName: 'Manicura Semipermanente Clásica',
        staffId: 'stf-2',
        staffName: 'Camila Ríos',
        date: getFormattedDate(0),
        time: '10:00',
        duration: 45,
        price: 35000,
        status: 'completed',
        notes: 'Cliente frecuente. Prefiere tonos nudes y rosas pasteles.'
    },
    {
        id: 'apt-103',
        clientId: 'cli-3',
        clientName: 'Valentina Martínez',
        clientPhone: '3109876543',
        clientEmail: 'valentina@gmail.com',
        serviceId: 'srv-2',
        serviceName: 'Manicura Rusa & Kapping Gel',
        staffId: 'stf-2',
        staffName: 'Camila Ríos',
        date: getFormattedDate(0),
        time: '14:00',
        duration: 75,
        price: 55000,
        status: 'confirmed',
        notes: 'Esmaltado en tono lila pastel.'
    },
    {
        id: 'apt-104',
        clientId: 'cli-1',
        clientName: 'María Fernanda Ruiz',
        clientPhone: '3001234567',
        clientEmail: 'mafe.ruiz@gmail.com',
        serviceId: 'srv-4',
        serviceName: 'Pedicura Spa Hidratante Profunda',
        staffId: 'stf-4',
        staffName: 'Sofía Herrera',
        date: getFormattedDate(1),
        time: '11:15',
        duration: 60,
        price: 45000,
        status: 'confirmed',
        notes: 'Sensibilidad en talones.'
    }
];

const DEFAULT_SETTINGS = {
    spaName: 'LETY LOOK',
    slogan: 'Belleza Integral',
    phone: '+57 3138869676',
    whatsapp: '573138869676',
    address: 'Calle 100 #15-40, Chicó Norte, Bogotá D.C.',
    openTime: '08:00',
    closeTime: '20:00',
    slotInterval: 30,
    currency: '$',
    currencyCode: 'COP'
};

/**
 * Storage Manager Class
 */
class SpaDataManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
            localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
            localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(DEFAULT_STAFF));
        }
        if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
        }
        
        // Ensure settings have the exact official phone +57 3138869676
        const currentSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) : {};
        currentSettings.phone = '+57 3138869676';
        currentSettings.whatsapp = '573138869676';
        currentSettings.spaName = 'LETY LOOK';
        currentSettings.slogan = 'Belleza Integral';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...currentSettings }));

        if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
            localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
        }
    }

    // Categories
    getCategories() {
        return DEFAULT_CATEGORIES;
    }

    // Services
    getServices() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || [];
    }

    getServiceById(id) {
        return this.getServices().find(s => s.id === id);
    }

    saveService(service) {
        const services = this.getServices();
        if (service.id) {
            const idx = services.findIndex(s => s.id === service.id);
            if (idx !== -1) {
                services[idx] = service;
            } else {
                services.push(service);
            }
        } else {
            service.id = 'srv-' + Date.now();
            services.push(service);
        }
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.saveCloudDocument('lety_look_services', service.id, service);
        }
        return service;
    }

    deleteService(id) {
        let services = this.getServices();
        services = services.filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.deleteCloudDocument('lety_look_services', id);
        }
        return true;
    }

    // Staff
    getStaff() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF)) || [];
    }

    getStaffById(id) {
        return this.getStaff().find(st => st.id === id);
    }

    saveStaff(staffMember) {
        const staff = this.getStaff();
        if (staffMember.id) {
            const idx = staff.findIndex(st => st.id === staffMember.id);
            if (idx !== -1) {
                staff[idx] = staffMember;
            } else {
                staff.push(staffMember);
            }
        } else {
            staffMember.id = 'stf-' + Date.now();
            staff.push(staffMember);
        }
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.saveCloudDocument('lety_look_staff', staffMember.id, staffMember);
        }
        return staffMember;
    }

    deleteStaff(id) {
        let staff = this.getStaff();
        staff = staff.filter(st => st.id !== id);
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.deleteCloudDocument('lety_look_staff', id);
        }
        return true;
    }

    // ==========================================
    // CLIENT AUTHENTICATION & MANAGEMENT
    // ==========================================
    getClients() {
        let clients = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
        
        // Auto-consolidate clients from appointments if any are missing
        const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || [];
        let updated = false;

        appointments.forEach(apt => {
            if (!apt.clientName) return;
            const cleanPhone = apt.clientPhone ? apt.clientPhone.replace(/\D/g, '') : '';
            const cleanEmail = apt.clientEmail ? apt.clientEmail.trim().toLowerCase() : '';

            const exists = clients.some(c => 
                (c.id && apt.clientId && c.id === apt.clientId) ||
                (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail) ||
                (cleanPhone && cleanPhone.length >= 7 && c.phone && c.phone.replace(/\D/g, '') === cleanPhone)
            );

            if (!exists) {
                const newClient = {
                    id: apt.clientId || ('cli-' + Date.now()),
                    name: apt.clientName.trim(),
                    email: cleanEmail,
                    phone: cleanPhone || apt.clientPhone,
                    createdAt: apt.date || new Date().toISOString(),
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.clientName)}&background=d45979&color=fff&bold=true`
                };
                clients.push(newClient);
                updated = true;
            }
        });

        if (updated) {
            localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        }

        return clients;
    }

    getClientById(id) {
        return this.getClients().find(c => c.id === id);
    }

    getClientByEmailOrPhone(identifier) {
        if (!identifier) return null;
        const clean = identifier.trim().toLowerCase();
        const cleanPhone = identifier.trim().replace(/\D/g, '');
        return this.getClients().find(c => {
            const matchEmail = c.email && c.email.toLowerCase() === clean;
            const matchPhone = cleanPhone && cleanPhone.length >= 7 && c.phone && c.phone.replace(/\D/g, '') === cleanPhone;
            return matchEmail || matchPhone;
        });
    }

    registerClient(clientData) {
        const clients = this.getClients();
        const cleanEmail = clientData.email.trim().toLowerCase();
        const cleanPhone = clientData.phone.trim().replace(/\D/g, '');

        // Check if existing by email or full phone
        const existing = clients.find(c => 
            (c.email && c.email.toLowerCase() === cleanEmail) ||
            (cleanPhone && cleanPhone.length >= 7 && c.phone && c.phone.replace(/\D/g, '') === cleanPhone)
        );

        if (existing) {
            return { success: false, message: 'Ya existe una cuenta con este correo o número de WhatsApp.' };
        }

        const newClient = {
            id: 'cli-' + Date.now(),
            name: clientData.name.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            password: clientData.password,
            avatar: clientData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientData.name)}&background=d45979&color=fff&bold=true`,
            createdAt: new Date().toISOString()
        };

        clients.push(newClient);
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        this.setCurrentClient(newClient);
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.saveCloudDocument('lety_look_clients', newClient.id, newClient);
        }
        return { success: true, client: newClient };
    }

    async loginClient(identifier, password) {
        let client = this.getClientByEmailOrPhone(identifier);

        // If not found in localStorage, fetch from Firestore cloud directly
        if (!client && window.cloudService && window.cloudService.db) {
            try {
                const cleanId = (identifier || '').trim().toLowerCase();
                const cleanPhone = (identifier || '').trim().replace(/\D/g, '');
                const snapshot = await window.cloudService.db.collection('lety_look_clients').get();
                snapshot.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    const matchEmail = data.email && data.email.toLowerCase() === cleanId;
                    const matchPhone = cleanPhone && cleanPhone.length >= 7 && data.phone && data.phone.replace(/\D/g, '') === cleanPhone;
                    if (matchEmail || matchPhone) {
                        client = data;
                    }
                });

                if (client) {
                    let localClients = this.getClients();
                    const idx = localClients.findIndex(c => c.id === client.id);
                    if (idx !== -1) {
                        localClients[idx] = client;
                    } else {
                        localClients.push(client);
                    }
                    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(localClients));
                }
            } catch (err) {
                console.error('Error querying Firestore for client login:', err);
            }
        }

        if (!client) {
            return { success: false, message: 'No encontramos ninguna cuenta con ese correo o número.' };
        }
        if (client.password !== password) {
            return { success: false, message: 'La contraseña ingresada es incorrecta.' };
        }

        this.setCurrentClient(client);
        return { success: true, client };
    }

    async resetClientPassword(identifier, newPassword) {
        if (!identifier || !newPassword) {
            return { success: false, message: 'Por favor completa todos los campos requeridos.' };
        }
        if (newPassword.length < 4) {
            return { success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' };
        }

        let client = this.getClientByEmailOrPhone(identifier);

        // If not in localStorage yet, search in Firestore cloud directly
        if (!client && window.cloudService && window.cloudService.db) {
            try {
                const cleanId = (identifier || '').trim().toLowerCase();
                const cleanPhone = (identifier || '').trim().replace(/\D/g, '');
                const snapshot = await window.cloudService.db.collection('lety_look_clients').get();
                snapshot.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    const matchEmail = data.email && data.email.toLowerCase() === cleanId;
                    const matchPhone = cleanPhone && cleanPhone.length >= 7 && data.phone && data.phone.replace(/\D/g, '') === cleanPhone;
                    if (matchEmail || matchPhone) {
                        client = data;
                    }
                });

                if (client) {
                    let localClients = this.getClients();
                    const idx = localClients.findIndex(c => c.id === client.id);
                    if (idx !== -1) {
                        localClients[idx] = client;
                    } else {
                        localClients.push(client);
                    }
                    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(localClients));
                }
            } catch (err) {
                console.error('Error querying Firestore for client reset:', err);
            }
        }

        if (!client) {
            return { success: false, message: 'No encontramos ninguna cuenta con ese correo o número celular.' };
        }

        let clients = this.getClients();
        const clientIndex = clients.findIndex(c => c.id === client.id);
        if (clientIndex !== -1) {
            clients[clientIndex].password = newPassword;
            localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
            this.setCurrentClient(clients[clientIndex]);

            // Sync with Firestore Cloud immediately
            if (window.cloudService && window.cloudService.isInitialized) {
                window.cloudService.saveCloudDocument('lety_look_clients', clients[clientIndex].id, clients[clientIndex]);
            }

            return { success: true, client: clients[clientIndex], message: '¡Contraseña restablecida con éxito!' };
        }

        return { success: false, message: 'No fue posible actualizar la contraseña.' };
    }

    getCurrentClient() {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_CLIENT);
        if (!data) return null;
        try {
            const current = JSON.parse(data);
            const clients = this.getClients();
            const fresh = clients.find(c => c.id === current.id || (c.email && c.email.toLowerCase() === (current.email || '').toLowerCase()));
            if (fresh) {
                if (fresh.avatar && fresh.avatar !== current.avatar) {
                    current.avatar = fresh.avatar;
                    localStorage.setItem(STORAGE_KEYS.CURRENT_CLIENT, JSON.stringify(current));
                }
                return { ...current, ...fresh };
            }
            return current;
        } catch (e) {
            return null;
        }
    }

    setCurrentClient(client) {
        if (client) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_CLIENT, JSON.stringify(client));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_CLIENT);
        }
    }

    logoutClient() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CLIENT);
    }

    updateClientAvatar(clientId, newAvatarUrl) {
        let clients = this.getClients();
        const client = clients.find(c => c.id === clientId);
        if (client) {
            client.avatar = newAvatarUrl;
            localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
            
            const current = this.getCurrentClient();
            if (current && current.id === clientId) {
                current.avatar = newAvatarUrl;
                this.setCurrentClient(current);
            }

            if (window.cloudService && window.cloudService.isInitialized) {
                window.cloudService.saveCloudDocument('lety_look_clients', client.id, client);
            }
            return { success: true, client };
        }
        return { success: false, message: 'Cliente no encontrado' };
    }

    deleteClient(id) {
        let clients = this.getClients();
        clients = clients.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.deleteCloudDocument('lety_look_clients', id);
        }
        return true;
    }

    // ==========================================
    // APPOINTMENTS
    // ==========================================
    getAppointments() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || [];
    }

    getAppointmentById(id) {
        return this.getAppointments().find(a => a.id === id);
    }

    getClientAppointments(clientId, clientEmail, clientPhone) {
        const all = this.getAppointments();
        const cleanPhone = clientPhone ? clientPhone.replace(/\D/g, '') : null;
        
        return all.filter(a => {
            if (clientId && a.clientId === clientId) return true;
            if (clientEmail && a.clientEmail && a.clientEmail.toLowerCase() === clientEmail.toLowerCase()) return true;
            if (cleanPhone && a.clientPhone && a.clientPhone.replace(/\D/g, '') === cleanPhone) return true;
            return false;
        });
    }

    saveAppointment(appointment) {
        const appointments = this.getAppointments();
        if (appointment.id) {
            const idx = appointments.findIndex(a => a.id === appointment.id);
            if (idx !== -1) {
                appointments[idx] = appointment;
            } else {
                appointments.push(appointment);
            }
        } else {
            appointment.id = 'apt-' + Date.now();
            appointments.unshift(appointment);
        }
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.saveCloudDocument('lety_look_appointments', appointment.id, appointment);
        }

        // Seamlessly register/save client in lety_look_clients if provided
        if (appointment.clientName && (appointment.clientPhone || appointment.clientEmail)) {
            const clients = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
            const cleanPhone = appointment.clientPhone ? appointment.clientPhone.replace(/\D/g, '') : '';
            const cleanEmail = appointment.clientEmail ? appointment.clientEmail.trim().toLowerCase() : '';
            const exists = clients.some(c => 
                (c.id && appointment.clientId && c.id === appointment.clientId) ||
                (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail) ||
                (cleanPhone && cleanPhone.length >= 7 && c.phone && c.phone.replace(/\D/g, '') === cleanPhone)
            );

            if (!exists) {
                const newClient = {
                    id: appointment.clientId || ('cli-' + Date.now()),
                    name: appointment.clientName.trim(),
                    email: cleanEmail,
                    phone: appointment.clientPhone || cleanPhone,
                    createdAt: appointment.date || new Date().toISOString(),
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.clientName)}&background=d45979&color=fff&bold=true`
                };
                clients.push(newClient);
                localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
                if (window.cloudService && window.cloudService.isInitialized) {
                    window.cloudService.saveCloudDocument('lety_look_clients', newClient.id, newClient);
                }
            }
        }

        return appointment;
    }

    updateAppointmentStatus(id, status) {
        const appointments = this.getAppointments();
        const apt = appointments.find(a => a.id === id);
        if (apt) {
            apt.status = status;
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
            if (window.cloudService && window.cloudService.isInitialized) {
                window.cloudService.saveCloudDocument('lety_look_appointments', apt.id, apt);
            }
            return apt;
        }
        return null;
    }

    deleteAppointment(id) {
        let appointments = this.getAppointments();
        appointments = appointments.filter(a => a.id !== id);
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.deleteCloudDocument('lety_look_appointments', id);
        }
        return true;
    }

    // Settings
    getSettings() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
    }

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        if (window.cloudService && window.cloudService.isInitialized) {
            window.cloudService.saveCloudDocument('lety_look', 'settings', settings);
        }
        return settings;
    }

    resetToDefaults() {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(DEFAULT_STAFF));
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
    }
}

// Global instance
window.dataManager = new SpaDataManager();
