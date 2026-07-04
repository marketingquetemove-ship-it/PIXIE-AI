const sdk = require("microsoft-cognitiveservices-speech-sdk");
const path = require("path");
const keys = require("./keys.json");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv/lib/main");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

const AZURE_API_KEY = process.env.AZURE_API_KEY?.trim();
const AZURE_URL = process.env.AZURE_URL?.trim();
const DEPLOYMENT_NAME = process.env.DEPLOYMENT_NAME?.trim();
const AZURE_TIMEOUT_MS = 5000;
const speechKey = keys.speechKey;
const speechRegion = keys.speechRegion;

function respostaRapidaLocal(mensagem) {
  const texto = (mensagem || "").toLowerCase().trim();

  if (!texto) return null;

  if (texto.includes("oi") || texto.includes("olá") || texto.includes("ola")) {
    return "Olá! Eu sou a Pixie. Como posso te ajudar hoje?";
  }

  if (texto.includes("nome")) {
    return "Eu sou a Pixie, sua assistente digital.";
  }

  if (texto.includes("como vai") || texto.includes("como você está") || texto.includes("como você ta")) {
    return "Estou pronta e animada para te ajudar!";
  }

  if (texto.includes("obrigado") || texto.includes("obrigada")) {
    return "De nada! Fico feliz em ajudar.";
  }

  if (texto.includes("tchau") || texto.includes("bye")) {
    return "Até logo! Volte sempre que quiser conversar.";
  }

  return null;
}

async function gerarRespostaAzure(mensagem) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AZURE_TIMEOUT_MS);

  try {
    const response = await fetch(AZURE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEPLOYMENT_NAME,
        max_output_tokens: 120,
        temperature: 0.7,
        input: [
          {
            role: "system",
            content:
              "Você é a Pixie, uma assistente amigável, criativa e simpática. Responda sempre em português do Brasil, com clareza."
          },
          {
            role: "user",
            content: mensagem
          }
        ]
      })
    });

  const rawBody = await response.text();

  let data = {};

  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const erro =
      data?.error?.message ||
      rawBody ||
      `Erro da Azure OpenAI: ${response.status}`;

    throw new Error(erro);
  }

  const resposta =
    data?.output_text ||
    data?.output?.[0]?.content?.[0]?.text ||
    data?.output?.[1]?.content?.[0]?.text ||
    "Não consegui gerar uma resposta agora.";

  return resposta;
  } finally {
    clearTimeout(timeoutId);
  }
}

app.get("/", (req, res) => {
  res.redirect("/chat.html");
});

app.get("/chat", (req, res) => {
  res.redirect("/chat.html");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    provider: "Azure OpenAI",
    deployment: DEPLOYMENT_NAME,
    hasApiKey: Boolean(AZURE_API_KEY),
    hasUrl: Boolean(AZURE_URL)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const mensagem = req.body?.message?.trim();

    if (!mensagem) {
      return res.status(400).json({
        reply: "Digite uma mensagem para conversar com a Pixie."
      });
    }

    const respostaRapida = respostaRapidaLocal(mensagem);
    if (respostaRapida) {
      return res.json({ reply: respostaRapida, source: "local" });
    }

    if (!AZURE_API_KEY || !AZURE_URL || !DEPLOYMENT_NAME) {
      return res.status(500).json({
        reply:
          "A API da Azure ainda não está configurada corretamente no servidor."
      });
    }

    const reply = await gerarRespostaAzure(mensagem);

    res.json({ reply });
  } catch (error) {
    console.error("Erro Azure:", error.message);

    res.status(500).json({
      reply:
        "Ops! A Pixie teve um problema ao responder pela Azure. Verifique a chave, URL e deployment no arquivo .env."
    });
  }
});
app.post("/api/falar", async (req, res) => {
  const texto = req.body?.texto;

  if (!texto) {
    return res.status(400).json({ erro: "Texto não recebido" });
  }

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      speechKey,
      speechRegion
    );

    speechConfig.speechSynthesisVoiceName = "pt-BR-FranciscaNeural";

    const arquivoAudio = path.join(__dirname, "pixie-audio.wav");

    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(arquivoAudio);

    const synthesizer = new sdk.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    synthesizer.speakTextAsync(
      texto,
      result => {
        synthesizer.close();

        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          return res.sendFile(arquivoAudio);
        }

        return res.status(500).json({
          erro: "Erro ao gerar voz da Pixie"
        });
      },
      error => {
        console.error("Erro Azure Speech:", error);
        synthesizer.close();

        return res.status(500).json({
          erro: "Erro no Azure Speech"
        });
      }
    );
  } catch (erro) {
    console.error("Erro ao gerar áudio:", erro);

    return res.status(500).json({
      erro: "Erro ao gerar áudio"
    });
  }
});
app.listen(PORT, () => {
  console.log(`Backend da Pixie rodando em http://localhost:${PORT}`);
});

const SPEECH_KEY= "EmDLAPVAYL69QhHc78jsNnmqREyrnHsAJmo8J529IGtVaYgG7vC4JQQJ99CGACYeBjFXJ3w3AAAYACOGVJQH";
const SPEECH_REGION = "eastus";
const VOICE_NAME = "pt-BR-FranciscaNeural";

async function falarPixie(texto) {
  const url = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const ssml = `
    <speak version='1.0' xml:lang='pt-BR'>
      <voice xml:lang='pt-BR' name='${VOICE_NAME}'>
        ${texto}
      </voice>
    </speak>
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
      },
      body: ssml
    });

    if (!response.ok) {
      console.error("Erro na voz:", await response.text());
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.play();

  } catch (error) {
    console.error("Erro ao falar:", error);
  }
}
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");
const path = require("path");

const keys = require("./keys.json");
const speechKey = keys.speechKey;
const speechRegion = keys.speechRegion;
app.post("/api/falar", async (req, res) => {
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({
      erro: "Texto não recebido"
    });
  }

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      speechKey,
      speechRegion
    );

    speechConfig.speechSynthesisVoiceName =
      "pt-BR-FranciscaNeural";

    const arquivoAudio = path.join(
      __dirname,
      "pixie-audio.wav"
    );

    const audioConfig =
      sdk.AudioConfig.fromAudioFileOutput(arquivoAudio);

    const synthesizer = new sdk.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    synthesizer.speakTextAsync(
      texto,

      result => {
        synthesizer.close();

        if (
          result.reason ===
          sdk.ResultReason.SynthesizingAudioCompleted
        ) {
          res.sendFile(arquivoAudio);
        } else {
          console.error(result);
          res.status(500).json({
            erro: "Erro ao gerar voz da Pixie"
          });
        }
      },

      error => {
        console.error(error);
        synthesizer.close();

        res.status(500).json({
          erro: "Erro no Azure Speech"
        });
      }
    );

  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: "Erro ao gerar áudio"
    });
  }
});
app.listen(PORT, () => {
  console.log(`Backend da Pixie rodando em http://localhost:${PORT}`);
});