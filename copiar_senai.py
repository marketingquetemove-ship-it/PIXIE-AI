import requests
from bs4 import BeautifulSoup

url = "https://www.sp.senai.br/perguntas-frequentes"

html = requests.get(url).text
soup = BeautifulSoup(html, "html.parser")

texto = soup.get_text("\n", strip=True)

with open("perguntas_senai.txt", "w", encoding="utf-8") as arquivo:
    arquivo.write(texto)

print("Pronto! Arquivo criado: perguntas_senai.txt")