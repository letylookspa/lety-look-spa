/**
 * LETY LOOK SPA - Google Firebase Cloud Database Service
 * Connected to project: letylookspa
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
            this.setupRealtimeSync();
            this.checkAndSeedCloudDatabase();
            return { success: true, message: '¡Conectado exitosamente a Google Firebase Cloud (letylookspa)!' };
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
        this.onSyncCallbacks.forEach(cb => cb(collectionName));
    }

    setupRealtimeSync() {
        if (!this.isInitialized || !this.db) return;

        // 1. Sync Settings
        this.db.collection('lety_look').doc('settings').onSnapshot(doc => {
            if (doc.exists) {
                const cloudSettings = doc.data();
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
                this.triggerSync('settings');
            }
        }, err => console.log('Firestore settings listener error:', err));

        // 2. Sync Services
        this.db.collection('lety_look_services').onSnapshot(snapshot => {
            if (!snapshot.empty) {
                const services = [];
                snapshot.forEach(doc => services.push({ id: doc.id, ...doc.data() }));
                if (services.length > 0) {
                    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
                    this.triggerSync('services');
                }
            }
        }, err => console.log('Firestore services listener error:', err));

        // 3. Sync Staff
        this.db.collection('lety_look_staff').onSnapshot(snapshot => {
            if (!snapshot.empty) {
                const staff = [];
                snapshot.forEach(doc => staff.push({ id: doc.id, ...doc.data() }));
                if (staff.length > 0) {
                    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
                    this.triggerSync('staff');
                }
            }
        }, err => console.log('Firestore staff listener error:', err));

        // 4. Sync Appointments (Real-time live bookings from any phone)
        this.db.collection('lety_look_appointments').onSnapshot(snapshot => {
            if (!snapshot.empty) {
                const appointments = [];
                snapshot.forEach(doc => appointments.push({ id: doc.id, ...doc.data() }));
                localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
                this.triggerSync('appointments');
            }
        }, err => console.log('Firestore appointments listener error:', err));

        // 5. Sync Clients
        this.db.collection('lety_look_clients').onSnapshot(snapshot => {
            if (!snapshot.empty) {
                const clients = [];
                snapshot.forEach(doc => clients.push({ id: doc.id, ...doc.data() }));
                localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
                this.triggerSync('clients');
            }
        }, err => console.log('Firestore clients listener error:', err));
    }

    async saveCloudDocument(collection, id, data) {
        if (!this.isInitialized || !this.db) return false;
        try {
            const cleanData = { ...data };
            delete cleanData.id;
            await this.db.collection(collection).doc(id).set(cleanData, { merge: true });
            return true;
        } catch (e) {
            console.error(`Error saving to Firestore [${collection}]:`, e);
            return false;
        }
    }

    async deleteCloudDocument(collection, id) {
        if (!this.isInitialized || !this.db) return false;
        try {
            await this.db.collection(collection).doc(id).delete();
            return true;
        } catch (e) {
            console.error(`Error deleting from Firestore [${collection}]:`, e);
            return false;
        }
    }

    async checkAndSeedCloudDatabase() {
        if (!this.isInitialized || !this.db) return;
        try {
            const servicesDoc = await this.db.collection('lety_look_services').limit(1).get();
            if (servicesDoc.empty) {
                console.log('Seeding initial data into cloud Firestore...');
                await this.uploadAllLocalDataToCloud();
            }
        } catch (e) {
            console.log('Error checking cloud database seed status:', e);
        }
    }

    async uploadAllLocalDataToCloud() {
        if (!this.isInitialized || !this.db) {
            return { success: false, message: 'Firebase no inicializado.' };
        }

        try {
            const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || [];
            const staff = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF)) || [];
            const appointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || [];
            const clients = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
            const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};

            const batch = this.db.batch();

            // Settings
            const settingsRef = this.db.collection('lety_look').doc('settings');
            batch.set(settingsRef, settings);

            // Services
            services.forEach(s => {
                const ref = this.db.collection('lety_look_services').doc(s.id);
                const data = { ...s };
                delete data.id;
                batch.set(ref, data);
            });

            // Staff
            staff.forEach(st => {
                const ref = this.db.collection('lety_look_staff').doc(st.id);
                const data = { ...st };
                delete data.id;
                batch.set(ref, data);
            });

            // Appointments
            appointments.forEach(a => {
                const ref = this.db.collection('lety_look_appointments').doc(a.id);
                const data = { ...a };
                delete data.id;
                batch.set(ref, data);
            });

            // Clients
            clients.forEach(c => {
                const ref = this.db.collection('lety_look_clients').doc(c.id);
                const data = { ...c };
                delete data.id;
                batch.set(ref, data);
            });

            await batch.commit();
            console.log('All local data backed up to cloud Firestore!');
            return { success: true, message: '¡Toda la base de datos se ha respaldado y conectado a la nube con éxito!' };
        } catch (e) {
            console.error('Error uploading local data to cloud:', e);
            return { success: false, message: 'Error al subir datos: ' + e.message };
        }
    }
}

// Global Cloud Instance
window.cloudService = new FirebaseCloudService();
