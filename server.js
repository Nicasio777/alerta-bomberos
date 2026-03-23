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
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Conectado a Firebase: alerta-bomberos-90b60");
} catch (error) {
    console.error("❌ Error con serviceAccountKey.json:", error.message);
}

const db = admin.firestore();

// --- 2. CONFIGURACIÓN PUSH (Tus llaves actuales) ---
webpush.setVapidDetails(
    'mailto:nicolas@ejemplo.com',
    'BOAmma6av8hHbLa4vTv0CINdDcJr0MWU5uKIG4nlqGZDct3emIKrw8jFGagHCPG5GlKFxQN1AUSBEXSLaShQ0a8',
    'uN4FBMwcr9CSrClCe5ZiQaTw9qHpYFtqDas3JrKBs1c'
);

// --- 3. RUTA PARA REGISTRAR BOMBERO ---
app.post('/registrar-bombero', async (req, res) => {
    try {
        const { nombre, legajo, cuartel, token, sonidoConfigurado, estado } = req.body;

        const nuevoBombero = {
            nombre,
            legajo: parseInt(legajo),
            cuartel,
            token, // Es el objeto de suscripción para las notificaciones
            sonidoConfigurado: sonidoConfigurado || 'sirena1.mp3',
            estado: estado || 'Activo', // Por defecto entra como Activo
            fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('bomberos').add(nuevoBombero);
        console.log(`👨‍🚒 Bombero registrado: ${nombre} (${nuevoBombero.estado})`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 4. RUTA PARA ENVIAR ALERTA (GENERAL O GUARDIA) ---
app.post('/enviar-alerta', async (req, res) => {
    const { tipo, titulo, mensaje } = req.body; 
    
    try {
        let query;
        if (tipo === 'general') {
            // ALARMA GENERAL: Trae a todos los bomberos de la base
            query = db.collection('bomberos');
            console.log("🚨 DISPARANDO ALARMA GENERAL...");
        } else {
            // ALARMA DE GUARDIA: Solo a los que están "De Guardia"
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
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));