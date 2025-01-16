const serverUrl = "https://literate-disco-694769v55rqpf559-3000.app.github.dev"; // Cambia según tu entorno
const numberDisplay = document.getElementById("number");
const timerDisplay = document.getElementById("timer");

let timeLeft = 30;

// Función para obtener el número actual y el timestamp desde el servidor
async function fetchCurrentNumber() {
  try {
    const response = await fetch(`${serverUrl}/current-number`);
    if (!response.ok) {
      throw new Error(`Error en la respuesta del servidor: ${response.status}`);
    }
    const data = await response.json();

    // Actualiza el número en la interfaz
    numberDisplay.textContent = data.number;

    // Calcula el tiempo restante hasta el próximo número
    const now = Date.now();
    const timeElapsed = Math.floor((now - data.lastGeneratedTime) / 1000); // En segundos
    timeLeft = 30 - timeElapsed;

    // Evita tiempos negativos
    if (timeLeft < 0) timeLeft = 0;
  } catch (error) {
    console.error("Error al obtener el número:", error);
    timerDisplay.textContent = "Error al conectar con el servidor.";
  }
}

// Función para manejar el temporizador
function startTimer() {
  setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      timerDisplay.textContent = `Nuevo número en: ${timeLeft} segundos`;
    } else {
      fetchCurrentNumber(); // Obtén el nuevo número
      timeLeft = 30; // Reinicia el temporizador
    }
  }, 1000);
}

// Inicializa el juego
fetchCurrentNumber(); // Obtén el número inicial
startTimer(); // Inicia el temporizador

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Evita que el formulario se envíe de forma predeterminada

  const usernameOrEmail = document.getElementById("usernameOrEmail").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Inicio de sesión exitoso");
      console.log("Usuario:", data.user); // Muestra información del usuario en la consola
      // Opcional: Cierra el modal después del inicio de sesión
      const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
      loginModal.hide();
    } else {
      alert(data.error || "Error al iniciar sesión");
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    alert("Error al conectar con el servidor");
  }
});
