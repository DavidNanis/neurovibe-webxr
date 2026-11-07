const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Simulación de telemetría del sensor háptico/biométrico en tiempo real
io.on('connection', (socket) => {
    console.log('[NeuroVibe] Cliente conectado:', socket.id);

    // Emisión periódica de datos biométricos simulados
    const telemetryInterval = setInterval(() => {
        const telemetryData = {
            posturalStability: (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2),
            cognitiveLoadIndex: Math.floor(Math.random() * (65 - 35 + 1)) + 35,
            hapticIntensity: Math.floor(Math.random() * 100),
            timestamp: new Date().toLocaleTimeString()
        };
        socket.emit('telemetry_update', telemetryData);
    }, 2000);

    socket.on('disconnect', () => {
        console.log('[NeuroVibe] Cliente desconectado:', socket.id);
        clearInterval(telemetryInterval);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[NeuroVibe] Servidor ejecutándose en http://localhost:${PORT}`);
});