const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Innertube, UniversalCache } = require("youtubei.js");
const { existsSync, mkdirSync, createWriteStream, unlinkSync } = require("fs");

const ytdlpPath = path.join(__dirname, "../bin/yt-dlp");
const cookiesPath = path.join(__dirname, "../bin/cookies.txt");
const cookiesPath2 = path.join(__dirname, "../bin/cookies.json");
const cookiesJson = JSON.parse(fs.readFileSync(cookiesPath2, 'utf-8'));
const tempPath = path.join(__dirname, "../temp");
const formattedCookies = cookiesJson.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

const agentOptions = {
  pipelining: 5,
  maxRedirections: 0,
};

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
  await ensureExecutable(ytdlpPath);

  return new Promise((resolve, reject) => {
    execFile(ytdlpPath, args, (err, stdout, stderr) => {
      if (err) {
        console.log("Erro ao executar diretamente, tentando com 'python'...");
        execFile("python", [ytdlpPath, ...args], (pythonErr, pythonStdout, pythonStderr) => {
          if (pythonErr) {
            reject(`yt-dlp error: ${pythonStderr || pythonErr.message}`);
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

async function ytadl(input) {
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

async function ytvdl(input) {
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

async function yts(query) {
  const yt = await Innertube.create({ cache: new UniversalCache() });
  const search = await yt.search(query);
  return search;
}

module.exports = { ytadl, ytvdl, yts };