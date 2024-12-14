# @hiudyy/ytdl

Um módulo simples e eficiente para baixar vídeos e áudios do YouTube, além de realizar buscas por músicas.


---

## Instalação

Para instalar o módulo, use o gerenciador de pacotes npm:

```bash
npm install @hiudyy/ytdl
```


---

## Como usar

Importando o módulo

```javascript
const { ytvdl, yts, ytadl } = require("@hiudyy/ytdl");
```


---

## Funções disponíveis

_1. Pesquisar músicas (yts)_

Use esta função para buscar informações sobre uma música no YouTube.

```javascript
const { yts } = require("@hiudyy/ytdl");

(async () => {
    const query = "Bon Jovi - It's My Life";
    const video = (await yts(query)).videos[0];
    
    console.log(`Título: ${video.title.text}`);
    console.log(`ID: ${video.id}`);
    console.log(`Duração: ${video.thumbnail_overlays[0].text}`);
    console.log(`URL: https://www.youtube.com/watch?v=${video.id}`);
})();
```

Saída esperada:

```
Título: Bon Jovi - It's My Life (Official Music Video)
ID: vx2u5uUu3DE
Duração: 4:27
URL: https://www.youtube.com/watch?v=vx2u5uUu3DE
```


---

_2. Baixar vídeo do YouTube (ytvdl)_

Esta função baixa o vídeo de um link do YouTube.

```javascript
const { ytvdl } = require("@hiudyy/ytdl");

(async () => {
    const url = "https://www.youtube.com/watch?v=vx2u5uUu3DE";
    const video = await ytvdl(url);
    
    console.log("Download do vídeo concluído:", video);
})();
```


---

_3. Baixar áudio do YouTube (ytadl)_

Esta função baixa apenas o áudio de um vídeo do YouTube.

```javascript
const { ytadl } = require("@hiudyy/ytdl");

(async () => {
    const url = "https://www.youtube.com/watch?v=vx2u5uUu3DE";
    const audio = await ytadl(url);
    
    console.log("Download do áudio concluído:", audio);
})();
```


---

## Estrutura de Resposta

Quando você usa yts, a estrutura básica da resposta é:

```json
{
    "type": "Video",
    "id": "vx2u5uUu3DE",
    "title": {
        "text": "Bon Jovi - It's My Life (Official Music Video)"
    },
    "thumbnails": [
        {
            "url": "https://i.ytimg.com/vi/vx2u5uUu3DE/hq720.jpg",
            "width": 720,
            "height": 404
        }
    ],
    "thumbnail_overlays": [
        {
            "text": "4:27"
        }
    ],
    "author": {
        "name": "Bon Jovi",
        "url": "https://www.youtube.com/channel/UCkBwnm7GOfYHsacwUjriC-w"
    }
}
```


---

## Contribuição

Sinta-se à vontade para abrir issues ou enviar pull requests para melhorar o módulo.

Repositório GitHub: [🔗 Clique aqui](https://github.com/hiudyy/ytdl)


---

## Licença

Este projeto está licenciado sob a licença MIT.
