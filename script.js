// script.js: arquivo legado simplificado e sem erros.\n// O chat ativo usa chat.js.\n\nconsole.log('script.js carregado sem conflitos.');\n
document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chatMessages");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");

  function addMessage(text, type) {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${type}-bubble`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    messageInput.value = "";
    sendButton.disabled = true;
    sendButton.textContent = "...";

    const loading = document.createElement("div");
    loading.className = "bubble pixie-bubble";
    loading.textContent = "Pixie está pensando...";
    chatMessages.appendChild(loading);

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      loading.remove();

      addMessage(data.reply || "Não recebi resposta da API.", "pixie");
    } catch (error) {
      loading.remove();
      addMessage("Erro ao conectar com o servidor.", "pixie");
      console.error(error);
    }

    sendButton.disabled = false;
    sendButton.textContent = "Enviar";
    messageInput.focus();
  }

  sendButton.addEventListener("click", sendMessage);

  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
});
const reply = await gerarRespostaAzure(mensagem);
res.json({ reply });
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");
const pixieFace = document.getElementById("pixieFace");

function mudarCarinha(texto) {
  const msg = texto.toLowerCase();

  if (
    msg.includes("terror") ||
    msg.includes("medo") ||
    msg.includes("assustador") ||
    msg.includes("fantasma") ||
    msg.includes("morrer")
  ) {
    pixieFace.src = "pixie-medrosa.png";
    return;
  }

  if (
    msg.includes("amor") ||
    msg.includes("apaixonada") ||
    msg.includes("romântico") ||
    msg.includes("romantico") ||
    msg.includes("coração")
  ) {
    pixieFace.src = "pixie-apaixonada.png";
    return;
  }

  if (
    msg.includes("brava") ||
    msg.includes("raiva") ||
    msg.includes("irritada") ||
    msg.includes("contrariada") ||
    msg.includes("não gostei")
  ) {
    pixieFace.src = "pixie-brava.png";
    return;
  }

  if (
    msg.includes("feliz") ||
    msg.includes("alegre") ||
    msg.includes("obrigada") ||
    msg.includes("amei")
  ) {
    pixieFace.src = "pixie-feliz.png";
    return;
  }

  if (
    msg.includes("pensar") ||
    msg.includes("dúvida") ||
    msg.includes("duvida") ||
    msg.includes("explica")
  ) {
    pixieFace.src = "pixie-pensando.png";
    return;
  }

  pixieFace.src = "pixie-normal.png";
}

function adicionarMensagem(texto, tipo) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble", tipo);
  bubble.textContent = texto;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function enviarMensagem() {
  const mensagem = input.value.trim();

  if (!mensagem) return;

  mudarCarinha(mensagem);
function mudarCarinha(texto) {
  if (!pixieFace) {
    console.error("Imagem pixieFace não encontrada no HTML.");
    return;
  }

  const msg = texto.toLowerCase();

  if (msg.includes("medo") || msg.includes("terror")) {
    pixieFace.src = "pixie-medrosa.png";
  } else if (msg.includes("amor") || msg.includes("romântico") || msg.includes("romantico")) {
    pixieFace.src = "pixie-apaixonada.png";
  } else if (msg.includes("brava") || msg.includes("raiva")) {
    pixieFace.src = "pixie-brava.png";
  } else if (msg.includes("feliz") || msg.includes("amei")) {
    pixieFace.src = "pixie-feliz.png";
  } else if (msg.includes("dúvida") || msg.includes("duvida") || msg.includes("pensar")) {
    pixieFace.src = "pixie-pensando.png";
  } else {
    pixieFace.src = "pixie-normal.png";
  }
}
  adicionarMensagem(mensagem, "user-bubble");
  input.value = "";

  button.disabled = true;
  button.textContent = "Enviando...";

  try {
    const resposta = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: mensagem })
    });

    const dados = await resposta.json();

    adicionarMensagem(dados.reply || "Não consegui responder agora.", "pixie-bubble");
  } catch (erro) {
    adicionarMensagem("Erro ao conectar com a API.", "pixie-bubble");
  }

  button.disabled = false;
  button.textContent = "Enviar";
  input.focus();
}

button.addEventListener("click", enviarMensagem);

input.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    enviarMensagem();
  }
});
