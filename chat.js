(() => {
  const input = document.getElementById("messageInput");
  const button = document.getElementById("sendButton");
  const chatMessages = document.getElementById("chatMessages");
  const pixieFace = document.getElementById("pixieFace");

  if (!input || !button || !chatMessages || !pixieFace) {
    console.error("Chat não encontrado na página.");
    return;
  }

  function mudarExpressao(texto) {
    const valor = (texto || "").toLowerCase();
    let novaImagem = "pixie-normal.png";

    if (valor.includes("gargalh") || valor.includes("rindo") || valor.includes("kkkk") || valor.includes("haha") || valor.includes("risada")) {
      novaImagem = "pixie-gargalhando.png";
    } else if (valor.includes("vergonh") || valor.includes("envergonh") || valor.includes("tímida") || valor.includes("tímido") || valor.includes("timu")) {
      novaImagem = "pixie-vergonha.png";
    } else if (valor.includes("furiosa") || valor.includes("furioso") || valor.includes("irado") || valor.includes("raiva") || valor.includes("ódio") || valor.includes("odio")) {
      novaImagem = "pixie-furiosa.png";
    } else if (valor.includes("choro") || valor.includes("chorando") || valor.includes("lágrima") || valor.includes("triste") || valor.includes("chor")) {
      novaImagem = "pixie-choro.png";
    } else if (valor.includes("medo") || valor.includes("assust") || valor.includes("apen")) {
      novaImagem = "pixie-medo.png";
    } else if (valor.includes("amor") || valor.includes("apaixon") || valor.includes("fofo") || valor.includes("cute")) {
      novaImagem = "pixie-apaixonada.png";
    } else if (valor.includes("brava") || valor.includes("raiva") || valor.includes("irrit") || valor.includes("não") || valor.includes("nao")) {
      novaImagem = "pixie-brava.png";
    } else if (valor.includes("feliz") || valor.includes("alegre") || valor.includes("legal") || valor.includes("amei") || valor.includes("obrigada") || valor.includes("obrigado")) {
      novaImagem = "pixie-feliz.png";
    }

    pixieFace.style.transform = "scale(0.92)";
    pixieFace.style.filter = "brightness(1.2) drop-shadow(0 0 10px rgba(255,255,255,0.35))";

    setTimeout(() => {
      pixieFace.src = novaImagem;
      pixieFace.style.transform = "scale(1)";
      pixieFace.style.filter = "brightness(1.05)";
    }, 140);
  }

  function adicionarMensagem(texto, tipo = "pixie-bubble") {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", tipo);
    bubble.textContent = texto;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (tipo === "pixie-bubble") {
      pixieFalar(texto);
    }
  }

  function respostaLocal(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes("oi") || texto.includes("olá") || texto.includes("ola")) {
      return "Olá! Eu sou a Pixie. Como posso te ajudar hoje?";
    }

    if (texto.includes("nome")) {
      return "Eu sou a Pixie, sua assistente digital.";
    }

    return "Não consegui conectar com a API agora. Verifique a chave ou o acesso CORS.";
  }

  function extrairResposta(data) {
    return (
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      data?.choices?.[0]?.message?.content ||
      "Não consegui responder agora."
    );
  }

  async function enviarMensagem() {
    const mensagem = input.value.trim();

    if (!mensagem) {
      input.focus();
      return;
    }

    mudarExpressao(mensagem);
    adicionarMensagem(mensagem, "user-bubble");
    input.value = "";
    input.focus();

    button.disabled = true;
    button.textContent = "Enviando...";

    const pensando = document.createElement("div");
    pensando.classList.add("bubble", "pixie-bubble");
    pensando.textContent = "Pixie está pensando...";
    chatMessages.appendChild(pensando);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: mensagem })
      });

      const dados = await resposta.json();
      pensando.remove();

      if (!resposta.ok) {
        throw new Error(dados?.reply || dados?.error || "Erro ao conectar com o servidor.");
      
      }

      const respostaTexto = dados.reply || "Não consegui obter resposta da Pixie.";
      mudarExpressao(respostaTexto);
      adicionarMensagem(respostaTexto, "pixie-bubble");
    } catch (erro) {
      pensando.remove();
      console.warn("Fallback do chat ativado:", erro.message);
      const respostaTexto = respostaLocal(mensagem);
      mudarExpressao(respostaTexto);
      adicionarMensagem(respostaTexto, "pixie-bubble");
    } finally {
      button.disabled = false;
      button.textContent = "Enviar";
      input.focus();
    }
  }

  const voiceButton = document.getElementById("voiceButton");
  let isRecording = false;
  let lastVoiceTranscript = "";
  let isVoiceSending = false;
  let recognitionPermissionAsked = false;

  button.addEventListener("click", (event) => {
    event.preventDefault();
    enviarMensagem();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      enviarMensagem();
    }
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition && voiceButton) {
    recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.addEventListener("start", () => {
      isRecording = true;
      lastVoiceTranscript = "";
      isVoiceSending = false;
      voiceButton.textContent = "⏹️";
      voiceButton.classList.add("recording");
    });

    recognition.addEventListener("audiostart", () => {
      console.log("Microfone ativado.");
    });

    recognition.addEventListener("end", () => {
      isRecording = false;
      if (voiceButton) {
        voiceButton.textContent = "🎤";
        voiceButton.classList.remove("recording");
      }
    });

    recognition.addEventListener("result", (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const textoReconhecido = transcript.trim();
      input.value = textoReconhecido;

      if (event.results[event.results.length - 1].isFinal && textoReconhecido && !isVoiceSending && textoReconhecido !== lastVoiceTranscript) {
        lastVoiceTranscript = textoReconhecido;
        isVoiceSending = true;

        enviarMensagem().finally(() => {
          isVoiceSending = false;
        });
      }
    });

    recognition.addEventListener("error", (event) => {
      console.error("Speech recognition error:", event.error);
      isRecording = false;
      if (voiceButton) {
        voiceButton.textContent = "🎤";
        voiceButton.classList.remove("recording");
      }

      if (event.error === "not-allowed" && !recognitionPermissionAsked) {
        recognitionPermissionAsked = true;
        alert("Permita o microfone no navegador para falar com a Pixie.");
      }
    });

    voiceButton.addEventListener("click", async (event) => {
      event.preventDefault();
      if (!recognition) return;

      if (isRecording) {
        recognition.stop();
        return;
      }

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (erro) {
        console.error("Permissão do microfone negada:", erro);
        alert("Não foi possível acessar o microfone. Permita o acesso nas configurações do navegador.");
        return;
      }

      recognition.start();
    });
  } else if (voiceButton) {
    voiceButton.disabled = true;
    voiceButton.title = "Seu navegador não suporta reconhecimento de voz";
  }
})();
// =========================
// PIXIE FALA A RESPOSTA
// =========================

function falarPixie(texto) {
  if (!('speechSynthesis' in window) || !texto) return;

  speechSynthesis.cancel();

  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.rate = 1;
  fala.pitch = 1.3;
  fala.volume = 1;

  const vozes = speechSynthesis.getVoices();
  const voz = vozes.find(v => v.lang.startsWith("pt"));
  if (voz) {
    fala.voice = voz;
  }

  speechSynthesis.speak(fala);
}
async function pixieFalar(texto) {
  if (!texto) return;

  try {
    const resposta = await fetch("/api/falar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        texto: texto
      })
    });

    if (!resposta.ok) {
      throw new Error("Erro ao gerar voz no servidor");
    }

    const audioBlob = await resposta.blob();
    const audioURL = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioURL);
    await audio.play();
  } catch (erro) {
    console.error("Erro na voz da Pixie:", erro);
    falarPixie(texto);
  }
}
(() => {
  const input = document.getElementById("messageInput");
  const button = document.getElementById("sendButton");
  const voiceButton = document.getElementById("voiceButton");
  const chatMessages = document.getElementById("chatMessages");

  if (!input || !button || !chatMessages) {
    console.error("Chat não encontrado na página.");
    return;
  }

  function adicionarMensagem(texto, tipo = "pixie-bubble") {
    const bubble = document.createElement("div");

    bubble.classList.add("bubble", tipo);
    bubble.textContent = texto;

    chatMessages.appendChild(bubble);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function pixieFalar(texto) {
    if (!("speechSynthesis" in window)) {
      console.error("Navegador não suporta voz.");
      return;
    }

    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);

    fala.lang = "pt-BR";
    fala.rate = 1;
    fala.pitch = 1.1;
    fala.volume = 1;

    const vozes = window.speechSynthesis.getVoices();

    const vozBrasileira = vozes.find(
      voz =>
        voz.lang === "pt-BR" ||
        voz.lang.includes("pt-BR")
    );

    if (vozBrasileira) {
      fala.voice = vozBrasileira;
    }

    window.speechSynthesis.speak(fala);
  }

  async function enviarMensagem() {
    const mensagem = input.value.trim();

    if (!mensagem) {
      return;
    }

    adicionarMensagem(
      mensagem,
      "user-bubble"
    );

    input.value = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: mensagem
        })
      });

      const data = await response.json();

      const resposta =
        data.reply ||
        "Não consegui responder agora.";

      adicionarMensagem(
        resposta,
        "pixie-bubble"
      );

      pixieFalar(resposta);

    } catch (erro) {
      console.error(
        "Erro no chat:",
        erro
      );

      const respostaErro =
        "Ops! Não consegui responder agora.";

      adicionarMensagem(
        respostaErro,
        "pixie-bubble"
      );

      pixieFalar(respostaErro);
    }
  }

  button.addEventListener(
    "click",
    enviarMensagem
  );

  input.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();

        enviarMensagem();
      }
    }
  );

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error(
      "Reconhecimento de voz não suportado."
    );

    if (voiceButton) {
      voiceButton.disabled = true;
    }

    return;
  }

  const recognition =
    new SpeechRecognition();

  recognition.lang = "pt-BR";

  recognition.continuous = false;

  recognition.interimResults = false;

  recognition.maxAlternatives = 1;

  voiceButton.addEventListener(
    "click",
    () => {
      try {
        voiceButton.textContent = "🔴";

        recognition.start();

      } catch (erro) {
        console.error(
          "Erro ao abrir microfone:",
          erro
        );
      }
    }
  );

  recognition.onresult = event => {
    const textoFalado =
      event.results[0][0].transcript;

    console.log(
      "Bruna falou:",
      textoFalado
    );

    input.value = textoFalado;

    enviarMensagem();
  };

  recognition.onerror = event => {
    console.error(
      "Erro no microfone:",
      event.error
    );

    voiceButton.textContent = "🎤";
  };

  recognition.onend = () => {
    voiceButton.textContent = "🎤";
  };

  window.speechSynthesis.onvoiceschanged =
    () => {
      window.speechSynthesis.getVoices();
    };
})();
const response = await fetch("/api/chat", {

  method: "POST",

  headers: {

    "Content-Type": "application/json"

  },

  body: JSON.stringify({

    message: mensagem

  })

});


const data = await response.json();


const resposta = data.reply;


adicionarMensagem(

  resposta,

  "pixie-bubble"

);


pixieFalar(resposta);


