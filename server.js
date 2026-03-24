const express = require('express');
const admin = require('firebase-admin');
const webpush = require('web-push');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- 1. CONEXIÓN A FIREBASE ---
let db; 

try {
    let serviceAccount;

    if (process.env.FIREBASE_CONFIG_JSON) {
        // Limpiamos errores de pegado en Render
        const cleanJson = process.env.FIREBASE_CONFIG_JSON.replace(/\\n/g, '\n');
        serviceAccount = JSON.parse(cleanJson);
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
    
    // DEFINIMOS DB AQUÍ ADENTRO
    db = admin.firestore(); 
    console.log("✅ Conexión exitosa a Firebase: " + serviceAccount.project_id);
} catch (error) {
    console.error("❌ ERROR CRÍTICO DE AUTENTICACIÓN:", error.message);
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
        if (!db) throw new Error("La base de datos no está conectada");

        const { nombre, legajo, cuartel, token, sonidoConfigurado, estado } = req.body;

        const nuevoBombero = {
            nombre,
            legajo: parseInt(legajo),
            cuartel,
            token, 
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
        if (!db) throw new Error("La base de datos no está conectada");

        let query;
        if (tipo === 'general') {
            query = db.collection('bomberos');
            console.log("🚨 DISPARANDO ALARMA GENERAL...");
        } else {
            query = db.collection('bomberos').where('estado', '==', 'De Guardia');
            console.log("🚒 DISPARANDO ALARMA DE GUARDIA...");
        }

        const snapshot = await query.get();
        let contador = 0;

        snapshot.forEach(doc => {
            const b = doc.data();
            if (b.token) {
                const payload = JSON.stringify({
                    titulo: titulo,
                    mensaje: mensaje,
                    sonido: b.sonidoConfigurado
                });
                webpush.sendNotification(b.token, payload).catch(err => console.log("Token inválido"));
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