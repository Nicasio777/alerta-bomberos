const express = require('express');
const axios = require('axios'); // Necesitamos instalar esto: npm install axios
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE TELEGRAM ---
// Poné estos valores en las variables de entorno de Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; 
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; 

// --- RUTA PARA DISPARAR LA ALERTA ---
app.post('/enviar-alerta', async (req, res) => {
    const { tipo, titulo, mensaje } = req.body;
    
    // Armamos el texto que va a llegar al celular
    const icono = tipo === 'general' ? '🚨🚨 ALARMA GENERAL 🚨🚨' : '🚒 ALARMA DE GUARDIA 🚒';
    const textoFinal = `${icono}\n\n*${titulo}*\n${mensaje}`;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: textoFinal,
            parse_mode: 'Markdown' // Para que el título salga en negrita
        });

        console.log("✅ Alerta enviada a Telegram");
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error enviando a Telegram:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "No se pudo enviar el mensaje" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor de Alerta listo en puerto ${PORT}`));