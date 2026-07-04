import os

import requests

from flask import Flask, request, jsonify, send_from_directory

from dotenv import load_dotenv


load_dotenv()


app = Flask(__name__)


AZURE_API_KEY = os.getenv("AZURE_API_KEY")

AZURE_URL = os.getenv("AZURE_URL")

DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME")


@app.route("/")
def inicio():

    return send_from_directory(".", "chat.html")


@app.route("/<path:arquivo>")
def arquivos(arquivo):

    return send_from_directory(".", arquivo)


@app.route("/api/chat", methods=["POST"])
def chat():

    try:

        dados = request.get_json()

        mensagem = dados.get("message", "").strip()


        if not mensagem:

            return jsonify({

                "reply": "Digite uma mensagem para conversar comigo."

            }), 400


        headers = {

            "Content-Type": "application/json",

            "api-key": AZURE_API_KEY

        }


        payload = {

            "model": DEPLOYMENT_NAME,

            "max_output_tokens": 180,

            "input": [

                {

                    "role": "system",

                    "content": "Você é a Pixie, uma assistente amigável, criativa e inteligente. Responda sempre em português do Brasil."

                },

                {

                    "role": "user",

                    "content": mensagem

                }

            ]

        }


        resposta = requests.post(

            AZURE_URL,

            headers=headers,

            json=payload,

            timeout=30

        )


        resposta.raise_for_status()


        dados_azure = resposta.json()


        texto = dados_azure.get("output_text")


        if not texto:

            for item in dados_azure.get("output", []):

                for conteudo in item.get("content", []):

                    if conteudo.get("text"):

                        texto = conteudo["text"]

                        break


        if not texto:

            texto = "Não consegui gerar uma resposta agora."


        return jsonify({

            "reply": texto

        })


    except Exception as erro:

        print("ERRO PIXIE:", erro)


        return jsonify({

            "reply": "Ops! Tive um problema ao responder."

        }), 500


if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=3000,

        debug=True

    )