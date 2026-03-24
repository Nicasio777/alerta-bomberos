const express = require('express');
const admin = require('firebase-admin'); // <--- ESTO DEBE ESTAR ARRIBA
const webpush = require('web-push');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- 1. CONEXIÓN A FIREBASE (CORREGIDO) ---
let db; 

try {
    let serviceAccount;

    if (process.env.FIREBASE_CONFIG_JSON) {
        // Render: Intentamos parsear directo
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
        } catch (e) {
            // Si falla por los saltos de línea, los limpiamos
            const fixedJson = process.env.FIREBASE_CONFIG_JSON.replace(/\\n/g, '\n');
            serviceAccount = JSON.parse(fixedJson);
        }
        console.log("📡 Credenciales cargadas desde Render.");
    } else {
        serviceAccount = require('./serviceAccountKey.json');
        console.log("🏠 Credenciales locales cargadas.");
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    
    db = admin.firestore(); 
    console.log("✅ Conexión exitosa a Firebase: " + serviceAccount.project_id);
} catch (error) {
    console.error("❌ ERROR EN FIREBASE:", error.message);
}

// --- 2. CONFIGURACIÓN PUSH ---
webpush.setVapidDetails(
    'mailto:nicolasminetti777@gmail.com',
    'BOAmma6av8hHbLa4vTv0CINdDcJr0MWU5uKIG4nlqGZDct3emIKrw8jFGagHCPG5GlKFxQN1AUSBEXSLaShQ0a8',
    'uN4FBMwcr9CSrClCe5ZiQaTw9qHpYFtqDas3JrKBs1c'
);

// --- 3. RUTA PARA REGISTRAR BOMBERO ---
app.post('/registrar-bombero', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: "Base de datos no conectada" });

        const { nombre, legajo, cuartel, token, sonidoConfigurado, estado } = req.body;

        const nuevoBombero = {
            nombre: nombre || "Sin nombre",
            legajo: parseInt(legajo) || 0,
            cuartel: cuartel || "General",
            token: token || null, 
            sonidoConfigurado: sonidoConfigurado || 'sirena1.mp3',
            estado: estado || 'Activo',
            fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('bomberos').add(nuevoBombero);
        console.log(`👨‍🚒 Bombero registrado: ${nombre}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Error en registro:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 4. RUTA PARA ENVIAR ALERTA ---
app.post('/enviar-alerta', async (req, res) => {
    const { tipo, titulo, mensaje } = req.body; 
    
    try {
        if (!db) return res.status(500).json({ error: "Base de datos no conectada" });

        let query = db.collection('bomberos');
        if (tipo !== 'general') {
            query = query.where('estado', '==', 'De Guardia');
        }

        const snapshot = await query.get();
        let contador = 0;

        snapshot.forEach(doc => {
            const b = doc.data();
            if (b.token) {
                const payload = JSON.stringify({
                    titulo: titulo || "ALERTA",
                    mensaje: mensaje || "Emergencia en curso",
                    sonido: b.sonidoConfigurado
                });
                webpush.sendNotification(b.token, payload).catch(() => {});
                contador++;
            }
        });

        res.json({ success: true, enviados: contador });
    } catch (e) {
        console.error("❌ Error al enviar alerta:", e.message);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));