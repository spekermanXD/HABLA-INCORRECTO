# ============================================================
#  🎓 HABLA CORRECTO - Backend Flask
# ============================================================

from flask import Flask, render_template, request, jsonify
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
import speech_recognition as sr
from googletrans import Translator
import random
import os

app = Flask(__name__)

# ============================================================
#  📚 PALABRAS POR NIVEL
# ============================================================

words_by_level = {
    "facil": ["gato", "perro", "manzana", "leche", "sol", "luna", "casa", "arbol", "flor", "libro"],
    "medio": ["banano", "escuela", "amigo", "ventana", "amarillo", "cielo", "mariposa", "montaña", "ciudad", "familia"],
    "dificil": ["tecnologia", "universidad", "informacion", "pronunciacion", "imaginacion", "desarrollo", "conocimiento", "creatividad", "comunicacion", "sostenibilidad"]
}

# ============================================================
#  ⚙️ CONFIGURACIÓN
# ============================================================

DURACION = 5
SAMPLE_RATE = 44100
ARCHIVO = "output.wav"

# ============================================================
#  🏠 RUTA PRINCIPAL
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")

# ============================================================
#  📚 OBTENER PALABRAS
# ============================================================

@app.route("/get_words", methods=["POST"])
def get_words():
    data = request.get_json()
    nivel = data.get("nivel", "facil")
    cantidad = data.get("cantidad", 5)

    if nivel == "mixto":
        todas = []
        for lista in words_by_level.values():
            todas.extend(lista)
        palabras = todas
    else:
        palabras = words_by_level.get(nivel, words_by_level["facil"])

    random.shuffle(palabras)

    # Asegurar suficientes palabras
    while len(palabras) < cantidad:
        palabras += palabras
    palabras = palabras[:cantidad]

    return jsonify({"palabras": palabras})

# ============================================================
#  🌍 TRADUCIR PALABRA
# ============================================================

@app.route("/traducir", methods=["POST"])
def traducir():
    data = request.get_json()
    palabra = data.get("palabra", "")

    try:
        translator = Translator()
        resultado = translator.translate(palabra, src="es", dest="en")
        return jsonify({"traduccion": resultado.text.lower().strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
#  🎤 GRABAR AUDIO
# ============================================================

@app.route("/grabar", methods=["POST"])
def grabar():
    try:
        print("🔴 Grabando audio...")
        recording = sd.rec(
            int(DURACION * SAMPLE_RATE),
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="int16"
        )
        sd.wait()
        wav.write(ARCHIVO, SAMPLE_RATE, recording)
        print("✅ Grabación completada")
        return jsonify({"status": "ok", "mensaje": "Grabación completada"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
#  🧠 RECONOCER VOZ
# ============================================================

@app.route("/reconocer", methods=["POST"])
def reconocer():
    if not os.path.exists(ARCHIVO):
        return jsonify({"error": "No hay audio grabado"}), 400

    recognizer = sr.Recognizer()

    try:
        with sr.AudioFile(ARCHIVO) as source:
            audio = recognizer.record(source)
            texto = recognizer.recognize_google(audio, language="en-US")
            return jsonify({"texto": texto.lower().strip()})
    except sr.UnknownValueError:
        return jsonify({"texto": None, "error": "No se pudo entender el audio"})
    except sr.RequestError as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
#  🎤+🧠 GRABAR Y RECONOCER (TODO EN UNO)
# ============================================================

@app.route("/grabar_y_reconocer", methods=["POST"])
def grabar_y_reconocer():
    try:
        # 1. Grabar
        print("🔴 Grabando audio...")
        recording = sd.rec(
            int(DURACION * SAMPLE_RATE),
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="int16"
        )
        sd.wait()
        wav.write(ARCHIVO, SAMPLE_RATE, recording)
        print("✅ Grabación completada")

        # 2. Reconocer
        recognizer = sr.Recognizer()
        with sr.AudioFile(ARCHIVO) as source:
            audio = recognizer.record(source)
            texto = recognizer.recognize_google(audio, language="en-US")
            return jsonify({"texto": texto.lower().strip()})

    except sr.UnknownValueError:
        return jsonify({"texto": None, "mensaje": "No se pudo entender"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
#  ▶️ INICIO
# ============================================================

if __name__ == "__main__":
    app.run(debug=True, port=5000)
