/**
 * LETY LOOK SPA - Cloud Database Sync Service (Firebase Firestore)
 * Alojado en GitHub Pages con Base de Datos en la Nube Firebase (letylookspa)
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJ_rMu-lc-1MkZjvgd4XuUqEKLvOqyzZA",
  authDomain: "letylookspa.firebaseapp.com",
  projectId: "letylookspa",
  storageBucket: "letylookspa.firebasestorage.app",
  messagingSenderId: "703667516896",
  appId: "1:703667516896:web:0acc4fa1f998dcdbcc2785",
  measurementId: "G-MH164DVSXK"
};

const FIREBASE_CONFIG_KEY = 'lety_look_firebase_config';

const STORAGE_KEYS = window.STORAGE_KEYS || {
    SERVICES: 'lety_look_services',
    STAFF: 'lety_look_staff',
    APPOINTMENTS: 'lety_look_appointments',
    SETTINGS: 'lety_look_settings',
    CLIENTS: 'lety_look_clients',
    CURRENT_CLIENT: 'lety_look_current_client'
};
window.STORAGE_KEYS = STORAGE_KEYS;

class FirebaseCloudService {
    constructor() {
        this.app = null;
        this.db = null;
        this.isInitialized = false;
        this.onSyncCallbacks = [];
        this.init();
    }

    getConfig() {
        try {
            const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
            return raw ? JSON.parse(raw) : DEFAULT_FIREBASE_CONFIG;
        } catch (e) {
            return DEFAULT_FIREBASE_CONFIG;
        }
    }

    saveConfig(configObj) {
        if (!configObj || !configObj.apiKey || !configObj.projectId) {
            return { success: false, message: 'La configuración debe incluir al menos apiKey y projectId.' };
        }
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(configObj));
        return this.init();
    }

    init() {
        const config = this.getConfig();
        if (!config || !window.firebase) {
            this.isInitialized = false;
            return { success: false, message: 'Firebase SDK no cargado.' };
        }

        try {
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(config);
            } else {
                this.app = firebase.app();
            }
            this.db = firebase.firestore();
            this.isInitialized = true;
            this.setupRealtimeListeners();
            console.log('Firebase Cloud Service initialized successfully with Firestore (letylookspa).');
            return { success: true, message: '¡Conectado exitosamente a la base de datos en la nube!' };
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            this.isInitialized = false;
            return { success: false, message: error.message };
        }
    }

    onSync(callback) {
        if (typeof callback === 'function') {
            this.onSyncCallbacks.push(callback);
        }
    }

    triggerSync(collectionName) {
        this.onSyncCallbacks.forEach(cb => {
            try { cb(collectionName); } catch (e) { console.error('Sync callback error:', e); }
        });
    }

    setupRealtimeListeners() {
        if (!this.db) return;

        // 1. Sync Services
        this.db.collection('lety_look_services').onSnapshot(snapshot => {
            const cloudItems = [];
            snapshot.forEach(doc => cloudItems.push({ id: doc.id, ...doc.data() }));
            if (cloudItems.length > 0) {
                localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(cloudItems));
                this.triggerSync('services');
            }
        }, err => console.log('Firestore services sync error:', err));

        // 2. Sync Staff
        this.db.collection('lety_look_staff').onSnapshot(snapshot => {
            const cloudItems = [];
            snapshot.forEach(doc => cloudItems.push({ id: doc.id, ...doc.data() }));
            if (cloudItems.length > 0) {
                localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(cloudItems));
                this.triggerSync('staff');
            }
        }, err => console.log('Firestore staff sync error:', err));

        // 3. Sync Appointments
        this.db.collection('lety_look_appointments').onSnapshot(snapshot => {
            const cloudItems = [];
            snapshot.forEach(doc => cloudItems.push({ id: doc.id, ...doc.data() }));
            if (cloudItems.length > 0) {
                // Preserve local appointments not yet in cloud
                const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || [];
                const mergedMap = new Map();
                local.forEach(a => mergedMap.set(a.id, a));
                cloudItems.forEach(a => mergedMap.set(a.id, a));
                const merged = Array.from(mergedMap.values());
                localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(merged));
                this.triggerSync('appointments');
            }
        }, err => console.log('Firestore appointments sync error:', err));

        // 4. Sync Settings
        this.db.collection('lety_look').doc('settings').onSnapshot(doc => {
            if (doc.exists) {
                const cloudSettings = doc.data();
                const localSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...localSettings, ...cloudSettings }));
                this.triggerSync('settings');
            }
        }, err => console.log('Firestore settings sync error:', err));

        // 5. Sync Clients (Crucial: download all cloud clients to localStorage immediately)
        this.db.collection('lety_look_clients').onSnapshot(snapshot => {
            const cloudClients = [];
            snapshot.forEach(doc => cloudClients.push({ id: doc.id, ...doc.data() }));
            
            const localClients = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
            const mergedMap = new Map();
            
            // Retain local clients
            localClients.forEach(c => {
                if (c && c.id) mergedMap.set(c.id, c);
            });
            // Cloud clients take precedence (including updated passwords)
            cloudClients.forEach(c => {
                if (c && c.id) mergedMap.set(c.id, c);
            });

            const merged = Array.from(mergedMap.values());
            localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(merged));

            // Refresh CURRENT_CLIENT if currently logged in user was modified in cloud!
            const currentRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_CLIENT);
            if (currentRaw) {
                try {
                    const current = JSON.parse(currentRaw);
                    const freshClient = merged.find(c => c.id === current.id || (c.email && c.email.toLowerCase() === (current.email || '').toLowerCase()));
                    if (freshClient) {
                        localStorage.setItem(STORAGE_KEYS.CURRENT_CLIENT, JSON.stringify(freshClient));
                    }
                } catch (e) {}
            }

            // Auto-upload any local clients not yet in cloud
            localClients.forEach(c => {
                if (c && c.id && !cloudClients.some(cc => cc.id === c.id)) {
                    this.saveCloudDocument('lety_look_clients', c.id, c);
                }
            });

            this.triggerSync('clients');
        }, err => console.log('Firestore clients sync error:', err));
    }

    async saveCloudDocument(collectionName, docId, data) {
        if (!this.db || !this.isInitialized) return false;
        try {
            await this.db.collection(collectionName).doc(docId).set(data, { merge: true });
            return true;
        } catch (error) {
            console.error(`Error saving cloud document in ${collectionName}/${docId}:`, error);
            return false;
        }
    }

    async deleteCloudDocument(collectionName, docId) {
        if (!this.db || !this.isInitialized) return false;
        try {
            await this.db.collection(collectionName).doc(docId).delete();
            return true;
        } catch (error) {
            console.error(`Error deleting cloud document in ${collectionName}/${docId}:`, error);
            return false;
        }
    }

    async uploadAllLocalDataToCloud() {
        if (!this.db || !this.isInitialized) {
            return { success: false, message: 'La base de datos en la nube no está inicializada.' };
        }

        try {
            const batch = this.db.batch();
            const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || [];
            const staff = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF)) || [];
            const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || [];
            const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
            const clients = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];

            services.forEach(s => {
                const ref = this.db.collection('lety_look_services').doc(s.id);
                batch.set(ref, s, { merge: true });
            });

            staff.forEach(st => {
                const ref = this.db.collection('lety_look_staff').doc(st.id);
                batch.set(ref, st, { merge: true });
            });

            appointments.forEach(a => {
                const ref = this.db.collection('lety_look_appointments').doc(a.id);
                batch.set(ref, a, { merge: true });
            });

            const settingsRef = this.db.collection('lety_look').doc('settings');
            batch.set(settingsRef, settings, { merge: true });

            clients.forEach(c => {
                const ref = this.db.collection('lety_look_clients').doc(c.id);
                batch.set(ref, c, { merge: true });
            });

            await batch.commit();
            return { success: true, message: '¡Datos locales sincronizados exitosamente con la nube de Firebase!' };
        } catch (error) {
            console.error('Batch sync error:', error);
            return { success: false, message: 'Error al sincronizar con la nube: ' + error.message };
        }
    }
}

window.cloudService = new FirebaseCloudService();
