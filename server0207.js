const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const AZURE_API_KEY = process.env.AZURE_API_KEY?.trim();
const AZURE_URL = process.env.AZURE_URL?.trim();
const DEPLOYMENT_NAME = process.env.DEPLOYMENT_NAME?.trim();

async function gerarRespostaAzure(mensagem) {
  const response = await fetch(AZURE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_API_KEY
    },
    body: JSON.stringify({
      model: DEPLOYMENT_NAME,
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
}

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