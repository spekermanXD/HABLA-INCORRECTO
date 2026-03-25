// ============================================================
//  🎮 HABLA CORRECTO - Lógica del Juego
// ============================================================

// --- Variables del juego ---
let nivelSeleccionado = "facil";
let rondasSeleccionadas = 5;
let palabras = [];
let traduccionActual = "";
let rondaActual = 0;
let puntos = 0;
let vidas = 3;
let racha = 0;
let mejorRacha = 0;
let correctas = 0;
let errores = [];

// ============================================================
//  🔀 NAVEGACIÓN ENTRE PANTALLAS
// ============================================================

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
}

function mostrarMenu() {
    mostrarPantalla('pantalla-menu');
}

function mostrarInstrucciones() {
    mostrarPantalla('pantalla-instrucciones');
}

function mostrarConfiguracion() {
    mostrarPantalla('pantalla-config');
}

// ============================================================
//  ⚙️ CONFIGURACIÓN
// ============================================================

function seleccionarNivel(btn) {
    document.querySelectorAll('.btn-nivel').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    nivelSeleccionado = btn.dataset.nivel;
}

function seleccionarRondas(btn) {
    document.querySelectorAll('.btn-rondas').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    rondasSeleccionadas = parseInt(btn.dataset.rondas);
}

// ============================================================
//  🚀 INICIAR JUEGO
// ============================================================

async function iniciarJuego() {
    // Resetear variables
    rondaActual = 0;
    puntos = 0;
    vidas = 3;
    racha = 0;
    mejorRacha = 0;
    correctas = 0;
    errores = [];

    // Obtener palabras del servidor
    try {
        const response = await fetch('/get_words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nivel: nivelSeleccionado,
                cantidad: rondasSeleccionadas
            })
        });
        const data = await response.json();
        palabras = data.palabras;

        mostrarPantalla('pantalla-juego');
        cargarRonda();
    } catch (error) {
        alert("Error al obtener palabras: " + error);
    }
}

// ============================================================
//  📖 CARGAR RONDA
// ============================================================

async function cargarRonda() {
    // Ocultar resultado y pista anterior
    document.getElementById('resultado-container').classList.add('oculto');
    document.getElementById('grabando-container').classList.add('oculto');
    document.getElementById('pista-container').classList.add('oculto');

    // Habilitar botones
    document.getElementById('btn-grabar').disabled = false;
    document.getElementById('btn-pista').disabled = false;

    // Actualizar barra de estado
    actualizarEstado();

    // Mostrar palabra
    const palabra = palabras[rondaActual];
    document.getElementById('palabra-actual').textContent = palabra.toUpperCase();

    // Obtener traducción
    try {
        const response = await fetch('/traducir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ palabra: palabra })
        });
        const data = await response.json();
        traduccionActual = data.traduccion;
    } catch (error) {
        console.error("Error al traducir:", error);
    }
}

// ============================================================
//  📊 ACTUALIZAR ESTADO
// ============================================================

function actualizarEstado() {
    document.getElementById('puntos-display').textContent = puntos;
    document.getElementById('ronda-display').textContent = `${rondaActual + 1}/${palabras.length}`;
    document.getElementById('racha-display').textContent = racha;

    let vidasHTML = "";
    for (let i = 0; i < 3; i++) {
        vidasHTML += i < vidas ? "❤️ " : "🖤 ";
    }
    document.getElementById('vidas-display').innerHTML = vidasHTML;
}

// ============================================================
//  💡 PEDIR PISTA
// ============================================================

function pedirPista() {
    if (!traduccionActual) return;

    puntos = Math.max(0, puntos - 5);
    actualizarEstado();

    const pista = traduccionActual[0] + " _ ".repeat(traduccionActual.length - 1);
    document.getElementById('pista-texto').textContent =
        `💡 ${pista} (${traduccionActual.length} letras)`;
    document.getElementById('pista-container').classList.remove('oculto');

    document.getElementById('btn-pista').disabled = true;
}

// ============================================================
//  🎤 GRABAR Y RECONOCER
// ============================================================

async function grabarYReconocer() {
    // Deshabilitar botones
    document.getElementById('btn-grabar').disabled = true;
    document.getElementById('btn-pista').disabled = true;

    // Mostrar animación de grabación
    document.getElementById('grabando-container').classList.remove('oculto');

    // Cuenta regresiva visual
    let cuenta = 5;
    const cuentaElement = document.getElementById('cuenta-regresiva');
    cuentaElement.textContent = cuenta;

    const intervalo = setInterval(() => {
        cuenta--;
        cuentaElement.textContent = cuenta;
        if (cuenta <= 0) clearInterval(intervalo);
    }, 1000);

    try {
        // Llamar al servidor para grabar + reconocer
        const response = await fetch('/grabar_y_reconocer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        clearInterval(intervalo);
        document.getElementById('grabando-container').classList.add('oculto');

        // Evaluar resultado
        evaluarRespuesta(data.texto);

    } catch (error) {
        clearInterval(intervalo);
        document.getElementById('grabando-container').classList.add('oculto');
        evaluarRespuesta(null);
    }
}

// ============================================================
//  ✅❌ EVALUAR RESPUESTA
// ============================================================

function evaluarRespuesta(textoDicho) {
    const container = document.getElementById('resultado-container');
    const card = document.getElementById('resultado-card');
    const emoji = document.getElementById('resultado-emoji');
    const texto = document.getElementById('resultado-texto');
    const escuche = document.getElementById('resultado-escuche');
    const correcto = document.getElementById('resultado-correcto');
    const puntosEl = document.getElementById('resultado-puntos');

    container.classList.remove('oculto');

    if (textoDicho && textoDicho.toLowerCase() === traduccionActual.toLowerCase()) {
        // ✅ CORRECTO
        const puntosBase = { facil: 10, medio: 20, dificil: 30, mixto: 25 };
        const pts = (puntosBase[nivelSeleccionado] || 10) + (racha * 5);
        puntos += pts;
        correctas++;
        racha++;
        mejorRacha = Math.max(mejorRacha, racha);

        card.className = 'resultado-card correcto';
        emoji.textContent = '🎉';
        texto.textContent = '¡¡CORRECTO!!';
        escuche.textContent = `🎧 Escuché: "${textoDicho}"`;
        correcto.textContent = `📖 Traducción: "${traduccionActual}"`;
        puntosEl.textContent = `+${pts} puntos ${racha > 1 ? '🔥 ¡Racha x' + racha + '!' : ''}`;

    } else {
        // ❌ INCORRECTO
        racha = 0;
        vidas--;

        const dicho = textoDicho || "???";
        errores.push({
            español: palabras[rondaActual],
            ingles: traduccionActual,
            dicho: dicho
        });

        card.className = 'resultado-card incorrecto';
        emoji.textContent = textoDicho ? '❌' : '🤔';
        texto.textContent = textoDicho ? 'INCORRECTO' : 'No entendí tu voz';
        escuche.textContent = textoDicho ? `🎧 Escuché: "${textoDicho}"` : '';
        correcto.textContent = `📖 Correcto: "${traduccionActual}"`;
        puntosEl.textContent = `❤️ Vidas restantes: ${vidas}`;
    }

    actualizarEstado();
}

// ============================================================
//  ➡️ SIGUIENTE RONDA
// ============================================================

function siguienteRonda() {
    rondaActual++;

    // Game Over por vidas
    if (vidas <= 0) {
        finDelJuego();
        return;
    }

    // Fin de rondas
    if (rondaActual >= palabras.length) {
        finDelJuego();
        return;
    }

    cargarRonda();
}

// ============================================================
//  🏁 FIN DEL JUEGO
// ============================================================

function finDelJuego() {
    mostrarPantalla('pantalla-fin');

    const total = rondaActual;
    const porcentaje = total > 0 ? (correctas / total * 100) : 0;

    let emojiResult, mensaje;
    if (porcentaje >= 90) {
        emojiResult = "🏆"; mensaje = "¡INCREÍBLE! ¡Maestro del inglés!";
    } else if (porcentaje >= 70) {
        emojiResult = "🌟"; mensaje = "¡MUY BIEN! ¡Gran dominio!";
    } else if (porcentaje >= 50) {
        emojiResult = "👍"; mensaje = "¡BIEN! ¡Sigue practicando!";
    } else if (porcentaje >= 30) {
        emojiResult = "💪"; mensaje = "¡No te rindas! ¡Puedes mejorar!";
    } else {
        emojiResult = "📚"; mensaje = "¡A estudiar más! ¡Tú puedes!";
    }

    document.getElementById('fin-emoji').textContent = emojiResult;
    document.getElementById('fin-mensaje').textContent = mensaje;
    document.getElementById('fin-puntos').textContent = puntos;
    document.getElementById('fin-correctas').textContent = `${correctas}/${total}`;
    document.getElementById('fin-porcentaje').textContent = `${porcentaje.toFixed(1)}%`;
    document.getElementById('fin-racha').textContent = mejorRacha;

    // Errores para repasar
    const erroresContainer = document.getElementById('errores-container');
    const erroresLista = document.getElementById('errores-lista');
    erroresLista.innerHTML = '';

    if (errores.length > 0) {
        erroresContainer.classList.remove('oculto');
        errores.forEach(err => {
            const div = document.createElement('div');
            div.className = 'error-item';
            div.textContent = `❌ ${err.español} → ${err.ingles} (dijiste: ${err.dicho})`;
            erroresLista.appendChild(div);
        });
    } else {
        erroresContainer.classList.add('oculto');
    }
}
