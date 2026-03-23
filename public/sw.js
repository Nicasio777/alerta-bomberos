self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    
    const title = data.title || "ALERTA BOMBEROS";
    const options = {
        body: data.body || "¡Atención! Nueva salida de emergencia.",
        icon: '/img/icon.png',
        badge: '/img/icon.png',
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
        data: {
            file: data.file || 'sirena.mp3'
        }
    };

    // Mandar mensaje al index.html para que suene el audio
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'PLAY_ALERTA',
                file: options.data.file
            });
        });
    });

    event.waitUntil(self.registration.showNotification(title, options));
});