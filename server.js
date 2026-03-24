const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path'); // Para manejar carpetas
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- ESTO ES CLAVE: LE DICE A RENDER DÓNDE ESTÁ TU WEB ---
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURACIÓN DE TELEGRAM ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; 
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; 

// --- RUTA PARA ENVIAR ALERTA ---
app.post('/enviar-alerta', async (req, res) => {
    const { tipo, titulo, mensaje } = req.body;
    
    const icono = tipo === 'general' ? '🚨🚨 ALARMA GENERAL 🚨🚨' : '🚒 ALARMA DE GUARDIA 🚒';
    const textoFinal = `${icono}\n\n*${titulo}*\n${mensaje}`;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: textoFinal,
            parse_mode: 'Markdown'
        });

        console.log("✅ Alerta enviada a Telegram");
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error Telegram:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "Error de conexión con Telegram" });
    }
});

// --- RUTA PARA QUE LA WEB NO TIRE ERROR AL CARGAR ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Sistema de Alerta Bomberos listo en puerto ${PORT}`));