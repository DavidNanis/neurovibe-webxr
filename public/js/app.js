// --- 1. CONFIGURACIÓN ENTORNO 3D ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070a12, 0.05);

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x38bdf8, 2, 50);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Variable global para la figura 3D
let coreMesh;

function buildMesh(mode) {
    let geometry, material;

    if (mode === 'optocinetico') {
        // Modo 2: Torus Knot (Rosca / Rejilla Compleja Amarilla)
        geometry = new THREE.TorusKnotGeometry(1.1, 0.35, 64, 16);
        material = new THREE.MeshPhongMaterial({
            color: 0xfacc15,
            wireframe: true,
            emissive: 0xca8a04,
            emissiveIntensity: 0.6
        });
    } else if (mode === 'propioceptivo') {
        // Modo 3: Dodecaedro Sólido (Cuerpo Geométrico Verde)
        geometry = new THREE.DodecahedronGeometry(1.5, 0);
        material = new THREE.MeshPhongMaterial({
            color: 0x22c55e,
            wireframe: false,
            flatShading: true,
            emissive: 0x15803d,
            emissiveIntensity: 0.4
        });
    } else {
        // Modo 1 (Default): Icosaedro Wireframe Cyan
        geometry = new THREE.IcosahedronGeometry(1.8, 1);
        material = new THREE.MeshPhongMaterial({
            color: 0x38bdf8,
            wireframe: true,
            emissive: 0x0284c7,
            emissiveIntensity: 0.5,
            shininess: 100
        });
    }

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

// Crear la primera figura inicial (Modo Suave)
coreMesh = buildMesh('suave');
scene.add(coreMesh);

// Sistema de Partículas Ambientales
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 400;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.04,
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6
});
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

camera.position.z = 4.5;

// Variables de Control
let rotationSpeed = 0.008;
let currentMode = 'suave';

// Bucle de Animación en Tiempo Real
function animate() {
    requestAnimationFrame(animate);

    if (coreMesh) {
        if (currentMode === 'optocinetico') {
            coreMesh.rotation.x += rotationSpeed * 2.2;
            coreMesh.rotation.y += rotationSpeed * 2.8;
        } else {
            coreMesh.rotation.x += rotationSpeed;
            coreMesh.rotation.y += rotationSpeed * 1.5;
        }
    }
    
    particlesMesh.rotation.y -= 0.001;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});


// --- 2. SISTEMA DE ALERTAS AUDITIVAS (WEB AUDIO API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeepAlert(freq = 600, type = 'sine', duration = 0.15) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}


// --- 3. CAMBIO DINÁMICO DE MODOS DE TERAPIA (REDUCCIÓN / RE-CREACIÓN 3D) ---
document.getElementById('therapy-mode').addEventListener('change', (e) => {
    currentMode = e.target.value;
    playBeepAlert(800, 'triangle', 0.1);

    // Eliminar la figura vieja de la escena 3D
    scene.remove(coreMesh);
    coreMesh.geometry.dispose();
    coreMesh.material.dispose();

    // Crear e insertar la nueva figura
    coreMesh = buildMesh(currentMode);
    scene.add(coreMesh);
});


// --- 4. GRÁFICA BIOMÉTRICA (CHART.JS) ---
const ctx = document.getElementById('bioChart').getContext('2d');
const bioChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(10).fill(''),
        datasets: [{
            label: 'Carga Cognitiva (%)',
            data: Array(10).fill(40),
            borderColor: '#f43f5e',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Estabilidad Postural (x100)',
            data: Array(10).fill(85),
            borderColor: '#38bdf8',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    }
});


// --- 5. TELEMETRÍA Y CONTROLES INTERACTIVOS ---
const socket = io();
let overrideStress = null;
let lastCognitive = 0;

socket.on('telemetry_update', (data) => {
    const cognitiveVal = overrideStress !== null ? overrideStress : data.cognitiveLoadIndex;
    const posturalVal = (1 - (cognitiveVal / 150)).toFixed(2);
    const hapticVal = data.hapticIntensity;

    lastCognitive = cognitiveVal;

    document.getElementById('postural-val').innerText = posturalVal;
    document.getElementById('cognitive-val').innerText = `${cognitiveVal}%`;
    document.getElementById('haptic-val').innerText = `${hapticVal}%`;
    document.getElementById('time-val').innerText = data.timestamp;

    document.getElementById('postural-bar').style.width = `${posturalVal * 100}%`;
    document.getElementById('cognitive-bar').style.width = `${cognitiveVal}%`;
    document.getElementById('haptic-bar').style.width = `${hapticVal}%`;

    if (coreMesh) {
        coreMesh.scale.setScalar(1 + (cognitiveVal / 100) * 0.4);
        rotationSpeed = 0.005 + (cognitiveVal / 2000);

        if (cognitiveVal > 70) {
            if (currentMode === 'suave') coreMesh.material.color.setHex(0xf43f5e);
            document.getElementById('patient-status').innerText = 'CRISIS DE FATIGA / MAREO DETECTADO';
            document.getElementById('patient-status').className = 'status-alert';
            playBeepAlert(300, 'sawtooth', 0.2);
        } else {
            if (currentMode === 'suave') coreMesh.material.color.setHex(0x38bdf8);
            document.getElementById('patient-status').innerText = 'OPTIMO // RANGO SEGURO';
            document.getElementById('patient-status').className = 'status-ok';
        }
    }

    bioChart.data.datasets[0].data.push(cognitiveVal);
    bioChart.data.datasets[0].data.shift();
    bioChart.data.datasets[1].data.push(posturalVal * 100);
    bioChart.data.datasets[1].data.shift();
    bioChart.update();
});

// Controles de simulación
document.getElementById('stress-slider').addEventListener('input', (e) => {
    overrideStress = parseInt(e.target.value);
});

document.getElementById('haptic-trigger').addEventListener('click', () => {
    playBeepAlert(900, 'sine', 0.15);
    if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 300]);
    if (coreMesh) coreMesh.scale.setScalar(1.8);
    alert('⚡ [NeuroVibe Core] Impulso de vibración háptica enviado al visor/dispositivo.');
});

document.getElementById('fail-trigger').addEventListener('click', () => {
    overrideStress = 95;
    document.getElementById('stress-slider').value = 95;
    playBeepAlert(200, 'sawtooth', 0.5);
    alert('⚠ [SIMULACIÓN DE CRISIS] Sobrecarga del sistema vestibular forzada a 95%. Observe la reacción del modelo 3D y la telemetría.');
});

document.getElementById('report-trigger').addEventListener('click', () => {
    playBeepAlert(1200, 'sine', 0.1);
    const modeName = document.getElementById('therapy-mode').selectedOptions[0].text;
    const timeNow = new Date().toLocaleTimeString();
    
    const reportSummary = `
=====================================================
    NEUROVIBE WebXR - REPORTED SESSION SUMMARY
=====================================================
Fecha y Hora: ${new Date().toLocaleDateString()} ${timeNow}
Modo de Terapia Activo: ${modeName}
Carga Cognitiva Final: ${lastCognitive}%
Estabilidad Postural Estimada: ${(1 - (lastCognitive / 150)).toFixed(2)}
Frecuencia Háptica Promedio: 65 Hz
Estado del Paciente: ${lastCognitive > 70 ? 'CRÍTICO / REVISE PARÁMETROS' : 'ÓPTIMO / ADHERENCIA CORRECTA'}
=====================================================
Informe generado automáticamente para historia clínica digital.
    `;
    alert(reportSummary);
});

document.getElementById('reset-trigger').addEventListener('click', () => {
    overrideStress = null;
    document.getElementById('stress-slider').value = 30;
    if (coreMesh) coreMesh.scale.setScalar(1);
    playBeepAlert(600, 'sine', 0.1);
    alert('🔄 [NEUROVIBE RESET] Sistema restablecido al modo automático telemétrico.');
});