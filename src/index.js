const { detectSystemInfo, ensureExecutable, handleFile, getVideoUrl, updateFile } = require('./../dist/utils.js');
const { Innertube } = require("youtubei.js");
const { execFile, exec } = require("child_process");
const ai = require('./ia/index.js');
const path = require("path");
const fs = require("fs");
const axios = require('axios');
const got = require("got");



updateFile();




const tempPath = path.join(__dirname, "../temp");
const tempDirSystem = path.join(tempPath, '/system');
fs.mkdirSync(tempDirSystem, { recursive: true });
let HiudyyDLPath = '';

async function clearSystemTempDir() {
  try {
    const command = "rm -rf " + tempDirSystem + "/*";
    exec(command, (err) => {
      if (err) {
        console.error('Erro ao limpar diretório temporário:', err.message);
      } else {
      }
    });
  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}

function loadAndShuffleCookies() {
const cookiesPath = path.join(__dirname, "../dist/cookies.json");
const cookiesArray = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
return cookiesArray.sort(() => Math.random() - 0.5);
};

async function findValidCookie() {
const cookiesArray = loadAndShuffleCookies();
const testedCookies = new Set();
for (const cookie of cookiesArray) {
if (testedCookies.has(cookie)) continue;
const tempCookiePath = path.join(__dirname, '../dist/cookie.txt');
fs.writeFileSync(tempCookiePath, cookie);
const isValid = await testCookie(tempCookiePath);
testedCookies.add(cookie);
if (isValid) {
return tempCookiePath;
}}
throw new Error('❌ [ERRO] Nenhum cookie válido foi encontrado.');
};

async function testCookie(cookiePath) {
const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const args = ["--no-cache-dir", "-F", "--cookies", cookiePath, url];
return new Promise((resolve, reject) => {
execFile(HiudyyDLPath, args, (error, stdout, stderr) => {
if (error) {
if (HiudyyDLPath.includes('hiudyydl_py')) {
execFile('python', [HiudyyDLPath, ...args], (pyErr, pyStdout, pyStderr) => {
if (pyErr) {
if (pyStderr.includes('This content isn') || (pyErr.message && pyErr.message.includes('This content isn'))) {
resolve(false);
} else {
resolve(true);
}} else {
resolve(true);
}});
} else if (stderr.includes('This content isn') || (error.message && error.message.includes('This content isn'))) {
resolve(false);
} else {
resolve(true);
}} else {
resolve(true);
}});
});
}

detectSystemInfo((error, architecture, platform) => {
  if (error) return console.error(`❌ [ERRO] Ao detectar o sistema: ${error.message}`);
  if (platform === 'android') {
    HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_py");
    console.log(`📱 [PLATAFORMA] Sistema Android detectado.`);
    console.log(`🚀 [@hiudyy/ytdl] Módulo inicializado com Python para Android.`);
    return;
  }
  if (platform !== 'linux' && platform !== 'win32') {
    return console.error(`❌ [PLATAFORMA] Este módulo é compatível apenas com sistemas Linux, Android e Windows.`);
  }
  console.log(`✅ [PLATAFORMA] Sistema detectado: ${platform}.`);

  switch (architecture) {
    case 'x64':
      HiudyyDLPath = path.join(__dirname, platform === 'win32' ? "../bin/hiudyydl_win_x64.zip" : "../bin/hiudyydl");
      console.log(`💻 [ARQUITETURA] Arquitetura x64 detectada.`);
      break;
    case 'arm':
      HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_v7");
      console.log(`🤖 [ARQUITETURA] Arquitetura ARM detectada.`);
      break;
    case 'arm64':
      HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_64");
      console.log(`🔧 [ARQUITETURA] Arquitetura ARM64 detectada.`);
      break;
    case 'x86':
      HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_win_x86.zip");
      console.log(`💻 [ARQUITETURA] Arquitetura x86 detectada.`);
      break;
    default:
      console.error(`❌ [ARQUITETURA] Arquitetura não suportada: ${architecture}`);
      return;
  }

  console.log(`✅ [@hiudyy/ytdl] Módulo inicializado com sucesso na arquitetura: ${architecture}.`);
});




const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];
const formatVideo = ['360', '480', '720', '1080', '1440', '4k'];

async function cekProgress(id) {
    const url = `https://p.oceansaver.in/ajax/progress.php?id=${id}`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Connection': 'keep-alive',
        'X-Requested-With': 'XMLHttpRequest'
    };

    while (true) {
        const response = await got.get(url, { headers }).json();
        if (response?.success && response.progress === 1000) {
            return response.download_url;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function ytdlv2(url, format) {
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
        throw new Error('Formato inválido');
    }

    const config = {
        method: 'GET',
        url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Connection': 'keep-alive',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    const response = await axios.request(config);

    if (response.data && response.data.success) {
        const { id, title, info } = response.data;
        const { image } = info;

        const downloadUrl = await cekProgress(id);

        return {
            id: id,
            image: image,
            title: title,
            downloadUrl: downloadUrl
        };
    }

    throw new Error('Falha ao buscar detalhes do vídeo');
}

async function ytmp3(input) {
    const url = getVideoUrl(input);
    const format = 'm4a';

    try {
        const { downloadUrl } = await ytdlv2(url, format);
        const stream = await got.stream(downloadUrl)
        return stream
    } catch (error) {
        console.error("Erro na função ytdlv2:", error);
        throw new Error("Falha ao baixar o arquivo.");
    }
}

async function ytmp4(input) {
    const url = getVideoUrl(input);
    const format = '360';

    try {
        const { downloadUrl } = await ytdlv2(url, format);
        const stream = await got.stream(downloadUrl)
        return stream;
    } catch (error) {
        console.error("Erro na função ytdlv2:", error);
        throw new Error("Falha ao baixar o arquivo.");
    }
}



async function alldl(input) {
  await clearSystemTempDir();
  const url = input;
  const results = [];
  const tempPathDl = path.join(tempPath, `${Math.floor(Math.random() * 100000)}_${Math.floor(Math.random() * 100000)}`);
  const outputTemplate = path.join(tempPathDl, "%(title)s_%(id)s.%(ext)s");

  try {
    await ensureExecutable(HiudyyDLPath);
    const validCookiePath = await findValidCookie();

    // Argumentos para listar formatos disponíveis
    const formatArgs = ["--no-cache-dir", "-F", "--cookies", validCookiePath, url];

    const formats = await new Promise((resolve, reject) => {
      execFile(HiudyyDLPath, formatArgs, (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout.trim());
      });
    });

    // Detecta tipos de arquivos suportados
    const hasAudio = /\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(formats) || formats.includes('audio');
    const hasVideo = /\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(formats) || formats.includes('video');
    const hasImages = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(formats) || formats.includes('image');
    const hasDocument = /\.(pdf|doc|docx|xls|xlsx|txt|ppt|pptx|zip|apk)$/i.test(formats) || formats.includes('document');

    const downloadArgsList = [];

    // Vídeo + Áudio com qualidade média
    if (hasVideo || !hasAudio) {
      downloadArgsList.push(["--no-cache-dir", "-f", "bestvideo+worstaudio/best", "--merge-output-format", "mp4", "--cookies", validCookiePath, "--output", outputTemplate, "--no-warnings", "--no-cache-dir", "--no-part"]);
    }

    // Áudio com qualidade mais baixa e rápido
    if (hasAudio) {
      downloadArgsList.push([
        "--no-cache-dir",
        "-f",
        "worstaudio",
        "--cookies",
        validCookiePath,
        "--output",
        outputTemplate,
        "--no-warnings",
        "--socket-timeout", "10",
        "--concurrent-fragments", "16",
        "--no-cache-dir", "--no-part",
      ]);
    }

    // Imagens
    if (hasImages) {
      downloadArgsList.push([
        "--no-cache-dir",
        "-f",
        "best",
        "--cookies",
        validCookiePath,
        "--output",
        outputTemplate,
        "--no-warnings",
        "--yes-playlist",
        "--no-cache-dir", "--no-part",
      ]);
    }

    // Documentos
    if (hasDocument) {
      downloadArgsList.push([
        "--no-cache-dir",
        "-f",
        "best",
        "--cookies",
        validCookiePath,
        "--output",
        outputTemplate,
        "--no-warnings",
        "--no-cache-dir", "--no-part",
      ]);
    }

    // Executa os downloads
    for (const args of downloadArgsList) {
  try {
    await new Promise((resolve, reject) => {
      execFile(HiudyyDLPath, args.concat(url), async (error, stdout, stderr) => {
        if (error) {
          if (HiudyyDLPath.includes("hiudyydl_py")) {
            execFile("python", [HiudyyDLPath, ...args, url], async (pyErr, pyStdout, pyStderr) => {
              if (pyErr) {
                await clearSystemTempDir();
                return reject(`Hiudyydl error (Python): ${pyStderr || pyErr.message}`);
              }
              resolve(pyStdout.trim());
            });
          } else {
            await clearSystemTempDir();
            return reject(`Hiudyydl error: ${stderr || error.message}`);
          }
        } else {
          resolve(stdout.trim());
        }
      });
    });

    // Se não houver erro, marca como sucesso
    console.log(`Execução bem-sucedida para args: ${args}`);
  } catch (err) {
    console.log(`Falha ao executar para args: ${args}. Erro: ${err}`);
    await clearSystemTempDir();
    console.error(`Erro após falha para args: ${args}.`);
    throw new Error(err); // Relança o erro imediatamente
  }
}


    // Processa os arquivos baixados
    const files = fs.readdirSync(tempPathDl);
    for (const file of files) {
      const filePath = path.join(tempPathDl, file);
      const extension = path.extname(file).toLowerCase();
      const convertedFilePath = path.join(tempPathDl, `converted_${path.basename(file, extension)}.mp4`);

      if ([".mp4", ".mkv", ".webm"].includes(extension)) {
        try {
          await convertToCompatibleVideo(filePath, convertedFilePath); // Converte o vídeo para formato compatível
          const buffer = fs.readFileSync(convertedFilePath);
          results.push({ type: "video", src: buffer, mimetype: "video/mp4" });
          fs.unlinkSync(filePath); // Remove o arquivo original
          fs.unlinkSync(convertedFilePath); // Remove o arquivo convertido
        } catch (conversionError) {
          console.error("Erro ao converter vídeo:", conversionError);
        }
      } else if ([".mp3", ".m4a", ".opus"].includes(extension)) {
        const buffer = fs.readFileSync(filePath);
        results.push({ type: "audio", src: buffer, mimetype: "audio/mpeg" });
        fs.unlinkSync(filePath);
      } else if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
        const buffer = fs.readFileSync(filePath);
        results.push({ type: "image", src: buffer, mimetype: "image/jpg" });
        fs.unlinkSync(filePath);
      } else if ([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".ppt", ".pptx"].includes(extension)) {
        const buffer = fs.readFileSync(filePath);
        results.push({ type: "document", src: buffer, mimetype: "application/octet-stream" });
        fs.unlinkSync(filePath);
      } else if ([".zip"].includes(extension)) {
        const buffer = fs.readFileSync(filePath);
        results.push({ type: "document", src: buffer, mimetype: "application/zip" });
        fs.unlinkSync(filePath);
      } else if ([".apk"].includes(extension)) {
        const buffer = fs.readFileSync(filePath);
        results.push({ type: "document", src: buffer, mimetype: "application/vnd.android.package-archive" });
        fs.unlinkSync(filePath);
      } else {
        const buffer = fs.readFileSync(filePath);
        results.push({ type: "unknown", src: buffer, mimetype: "application/octet-stream" });
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error("Erro ao baixar:", err);
  }

  return results;
}

async function convertToCompatibleVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg error:", stderr || error.message);
        return reject(error);
      }
      resolve();
    });
  });
}




async function yts(query) {
  const yt = await Innertube.create({ cache: null });
  const search = await yt.search(query);
  return search;
}




module.exports = { 
ytmp3, 
ytmp4,
ytadl: ytmp3, 
ytvdl: ytmp4, 
alldl, 
yts, 
ai: ai,
update: updateFile,
clear: clearSystemTempDir
};