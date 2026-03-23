// public/sw.js

// 1. Escuchar la notificación push desde el servidor
self.addEventListener('push', function(event) {
    console.log('Push recibido');
    // public/sw.js - Agregar esto dentro del listener 'push'
self.addEventListener('push', function(event) {
    const payload = event.data ? event.data.json() : {};
    const title = payload.titulo || 'Alerta';
    const soundFile = payload.sonido || 'sirena1.mp3';

    // 1. Mostrar la notificación
    const promiseChain = self.registration.showNotification(title, {
        body: payload.mensaje,
        data: { sonido: soundFile }
    });

    // 2. Avisar a la pestaña abierta que REPRODUZCA el sonido
    const messageChain = clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
            windowClients.forEach(windowClient => {
                windowClient.postMessage({
                    type: 'PLAY_ALERTA',
                    file: soundFile
                });
            });
        });

    event.waitUntil(Promise.all([promiseChain, messageChain]));
});

    let data = {
        titulo: '🚨 ALERTA DE BOMBEROS',
        mensaje: '¡CONVOCATORIA URGENTE!',
        sonido: 'sirena1.mp3' // Nombre del archivo por defecto
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data.titulo = payload.titulo || data.titulo;
            data.mensaje = payload.mensaje || data.mensaje;
            data.sonido = payload.sonido || data.sonido;
        } catch (e) {
            data.mensaje = event.data.text();
        }
    }

    const options = {
        body: data.mensaje,
        icon: '/img/icon.png', // Asegúrate de tener un icono en public/img/
        badge: '/img/badge.png',
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
        data: {
            url: '/',
            sonido: data.sonido
        },
        actions: [
            { action: 'confirmar', title: '✅ Voy' },
            { action: 'rechazar', title: '❌ No puedo' }
        ],
        tag: 'alerta-sirena',
        renotify: true
    };

    // 2. Mostrar la notificación visual
    event.waitUntil(
        self.registration.showNotification(data.titulo, options)
    );
});

// 3. Manejar el clic en la notificación
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Abrir la app al tocar la notificación
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});