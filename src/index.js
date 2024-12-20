const fs = require("fs");
const path = require("path");
const { Innertube, UniversalCache } = require("youtubei.js");
const os = require("os");

const cookiesPath = path.join(__dirname, "../bin/cookies.txt");
const cookiesPath2 = path.join(__dirname, "../bin/cookies.json");
const cookiesJson = JSON.parse(fs.readFileSync(cookiesPath2, 'utf-8'));
const tempPath = path.join(__dirname, "../temp");

let HiudyyDLPath = '';

function detectSystemInfo(callback) {
    const architecture = os.arch();
    const platform = os.platform();

    callback(null, architecture, platform);
}

detectSystemInfo((error, architecture, platform) => {
    if (error) {
        console.error(`Erro ao detectar o sistema: ${error.message}`);
        return;
    }

    if (platform !== 'linux') {
        console.error('Este módulo só é compatível com sistemas Linux.');
        return;
    }

    switch (architecture) {
        case 'x64':
            HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl");
            break;
        case 'arm':
            HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_v7");
            break;
        case 'arm64':
            HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_64");
            break;
        default:
            console.error(`Arquitetura não suportada: ${architecture}`);
            return;
    }

    console.log(`HiudyyDLPath definido para: ${HiudyyDLPath}`);
});

const formattedCookies = cookiesJson.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

function generateRandomName(extension) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `${timestamp}_${random}.${extension}`;
}

function getYouTubeID(input) {
  if (!input) return null;
  try {
    const url = new URL(input)
    const validDomains = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'youtube.co'
    ];
    if (!validDomains.some(domain => url.hostname.endsWith(domain))) {
      return input;
    }
    if (url.hostname === 'youtu.be') {
      return url.pathname.substring(1);
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/')[2];
      } else if (url.searchParams.has('v')) {
        return url.searchParams.get('v');
      } else if (url.pathname === '/watch') {
        return null;
      } else if (url.pathname.startsWith('/channel/')) {
        return null;
      } else if (url.pathname.startsWith('/user/')) {
        return null;
      } else if (url.pathname.startsWith('/playlist') && url.searchParams.has('list')) {
        return url.searchParams.get('list');
      }
    }
  } catch {
    return input;
  }
  return input;
}

function ensureExecutable(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.X_OK, (err) => {
      if (err) {
        console.warn(`Corrigindo permissões para ${filePath}`);
        execFile("chmod", ["+x", filePath], (chmodErr) => {
          if (chmodErr) reject(`Erro ao corrigir permissões: ${chmodErr.message}`);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

async function processOutput(args, tempFile) {
  await ensureExecutable(HiudyyDLPath);

  return new Promise((resolve, reject) => {
    execFile(HiudyyDLPath, args, (err, stdout, stderr) => {
      if (err) {
        console.log("Erro ao executar diretamente, tentando com 'python'...");
        execFile("python", [HiudyyDLPath, ...args], (pythonErr, pythonStdout, pythonStderr) => {
          if (pythonErr) {
            reject(`Hiudyydl error: ${pythonStderr || pythonErr.message}`);
          } else {
            handleFile(tempFile, resolve, reject);
          }
        });
      } else {
        handleFile(tempFile, resolve, reject);
      }
    });
  });
}

function handleFile(tempFile, resolve, reject) {
  fs.readFile(tempFile, (readErr, buffer) => {
    if (readErr) {
      reject(`Error reading file: ${readErr.message}`);
    } else {
      fs.unlink(tempFile, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting file: ${unlinkErr.message}`);
      });
      resolve(buffer);
    }
  });
}

function getVideoUrl(ajsjj) {
const idzz = getYouTubeID(ajsjj) ;
return `https://www.youtube.com/watch?v=${idzz}`;
};

async function ytmp3(input) {
  const url = getVideoUrl(input);
  const output = path.join(tempPath, generateRandomName("m4a"));
  const args = [
    "-f",
    "bestaudio[ext=m4a]",
    "--cookies",
    cookiesPath,
    "-o",
    output,
    url,
  ];
  return await processOutput(args, output);
}

async function ytmp4(input) {
  const url = getVideoUrl(input);
  const output = path.join(tempPath, generateRandomName("mp4"));
  const args = [
    "-f",
    "bestvideo+bestaudio[ext=mp4]/mp4",
    "--cookies",
    cookiesPath,
    "-o",
    output,
    url,
  ];
  return await processOutput(args, output);
}

async function alldl(input) {
  const url = input.startsWith("http") ? input : getVideoUrl(input);
  const results = [];
  const outputTemplate = path.join(tempPath, "%(title)s_%(id)s.%(ext)s");

  try {
    await ensureExecutable(HiudyyDLPath);

    const formatArgs = [
      "-F",
      "--cookies", cookiesPath,
      url,
    ];
    const formats = await new Promise((resolve, reject) => {
      execFile(HiudyyDLPath, formatArgs, (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout.trim());
      });
    });

    const hasAudio = /\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(formats) || formats.includes('audio');
    const hasVideo = /\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(formats) || formats.includes('video');
    const hasImages = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(formats) || formats.includes('image');

    const downloadArgsList = [];

    if (hasVideo || !hasAudio) {
      downloadArgsList.push([
        "-f", "bestvideo+bestaudio/best",
        "--merge-output-format", "mp4",
        "--cookies", cookiesPath,
        "--output", outputTemplate,
        "--no-warnings",
      ]);
    }

    if (hasAudio) {
      downloadArgsList.push([
        "-f", formats.includes('m4a') ? "bestaudio[ext=m4a]" : "bestaudio",
        "--cookies", cookiesPath,
        "--output", outputTemplate,
        "--no-warnings",
      ]);
    }

    if (hasImages) {
      downloadArgsList.push([
        "-f", "best",
        "--cookies", cookiesPath,
        "--output", outputTemplate,
        "--no-warnings",
        "--yes-playlist",
      ]);
    }

    for (const args of downloadArgsList) {
      await new Promise((resolve, reject) => {
        execFile(HiudyyDLPath, args.concat(url), (error, stdout) => {
          if (error) return reject(error);
          resolve(stdout.trim());
        });
      });
    }

    const files = fs.readdirSync(tempPath);
    for (const file of files) {
      const filePath = path.join(tempPath, file);
      const buffer = fs.readFileSync(filePath);
      const extension = path.extname(file).toLowerCase();
      let type = "";
      let mimetype = "";

      if ([".mp4", ".mkv", ".webm"].includes(extension)) {
        type = "video";
        mimetype = `video/mp4`;
      } else if ([".mp3", ".m4a", ".opus"].includes(extension)) {
        type = "audio";
        mimetype = `audio/mpeg`;
      } else if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
        type = "image";
        mimetype = `image/jpg`;
      } else if ([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".ppt", ".pptx"].includes(extension)) {
  type = "document";
  if (extension === ".pdf") {
    mimetype = "application/pdf";
  } else if (extension === ".doc" || extension === ".docx") {
    mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (extension === ".xls" || extension === ".xlsx") {
    mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (extension === ".txt") {
    mimetype = "text/plain";
  } else if (extension === ".ppt" || extension === ".pptx") {
    mimetype = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  } else {
    mimetype = `application/msword`;
  }
} else if ([".zip"].includes(extension)) {
  type = "document";
  mimetype = "application/zip";
} else if ([".apk"].includes(extension)) {
  type = "document";
  mimetype = "application/vnd.android.package-archive";
} else {
  type = "unknown";
  mimetype = "application/octet-stream";
}
      results.push({ type, src: buffer, mimetype });
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Erro ao baixar mídia: ${error.message}`);
  }

  return results;
}

async function yts(query) {
  const yt = await Innertube.create({ cache: new UniversalCache() });
  const search = await yt.search(query);
  return search;
}

module.exports = { ytmp3, ytadl: ytmp3, ytvdl: ytmp4, ytmp4, alldl, yts };