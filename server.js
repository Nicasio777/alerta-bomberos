// --- 1. CONEXIÓN A FIREBASE (VERSIÓN DEFINITIVA) ---
let db; 

try {
    let serviceAccount;

    if (process.env.FIREBASE_CONFIG_JSON) {
        // Leemos el JSON directamente. 
        // Si lo pegaste en una sola línea como te pasé, no necesita .replace
        serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
        console.log("📡 Cargando credenciales desde Render...");
    } else {
        serviceAccount = require('./serviceAccountKey.json');
        console.log("🏠 Cargando credenciales locales...");
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    
    db = admin.firestore(); 
    console.log("✅ Conexión exitosa a Firebase: " + serviceAccount.project_id);
} catch (error) {
    console.error("❌ ERROR CRÍTICO DE CONFIGURACIÓN:", error.message);
}