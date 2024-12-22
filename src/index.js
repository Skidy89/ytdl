const { detectSystemInfo, generateRandomName, getYouTubeID, ensureExecutable, handleFile, getVideoUrl } = require('./../dist/utils.js');
const { Innertube, UniversalCache } = require("youtubei.js");
const { execFile } = require("child_process");
const ai = require('./ia/index.js');
const path = require("path");
const fs = require("fs");
const os = require("os");
const fetch = require('node-fetch');




(async () => {
  const binPath = path.join(__dirname, '../bin/');
  const repos = [
    {
      repo: 'haccy/yt-dlp',
      versionFile: path.join(binPath, 'version1.txt'),
      files: [
        { suffix: 'yt-dlp', name: 'hiudyydl_py' },
        { suffix: 'yt-dlp_linux', name: 'hiudyydl' }
      ]
    },
    {
      repo: 'yt-dlp/yt-dlp',
      versionFile: path.join(binPath, 'version2.txt'),
      files: [
        { suffix: 'yt-dlp_linux_aarch64', name: 'hiudyydl_64' },
        { suffix: 'yt-dlp_linux_armv7l', name: 'hiudyydl_v7' }
      ]
    }
  ];

  fs.mkdirSync(binPath, { recursive: true });

  for (const { repo, versionFile, files } of repos) {
    const { tag_name, assets } = await fetch(`https://api.github.com/repos/${repo}/releases/latest`).then(r => r.json());
    const localVersion = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : null;
    if (localVersion === tag_name) {
      continue;
    }
    for (const { suffix, name } of files) {
      const asset = assets.find(a => a.name.endsWith(suffix));
      if (asset) {
        await fetch(asset.browser_download_url).then(r => r.body.pipe(fs.createWriteStream(path.join(binPath, name))));
      }
    }
    fs.writeFileSync(versionFile, tag_name);
    console.log(`Repositório atualizado para a versão: ${tag_name}`);
  }
})();




const cookiesPath = path.join(__dirname, "../bin/cookies.txt");
const tempPath = path.join(__dirname, "../temp");
let HiudyyDLPath = '';




detectSystemInfo((error, architecture, platform) => {
if (error) return console.error(`❌ [ERROR] Ao detectar o sistema: ${error.message}`);
if (platform === 'android') {
HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_py");
console.log(`📱 [PLATAFORMA] -> Sistema Android detectado.`);
console.log(`🚀 [@hiudyy/ytdl] -> Módulo inicializado com Python para Android.`);
return;};
if (platform !== 'linux' && platform !== 'android') return console.error(`❌ [PLATAFORMA] -> Este módulo é compatível apenas com sistemas Linux e Android.`);
console.log(`✅ [PLATAFORMA] -> Sistema Linux detectado.`);
switch (architecture) {
case 'x64':
HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl");
console.log(`💻 [ARQUITETURA] -> Arquitetura x64 detectada.`);
break;
case 'arm':
HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_v7");
console.log(`🤖 [ARQUITETURA] -> Arquitetura ARM detectada.`);
break;
case 'arm64':
HiudyyDLPath = path.join(__dirname, "../bin/hiudyydl_64");
console.log(`🔧 [ARQUITETURA] -> Arquitetura ARM64 detectada.`);
break;
default:
console.error(`❌ [ARQUITETURA] -> Arquitetura não suportada: ${architecture}`);
return;}
console.log(`✅ [@hiudyy/ytdl] -> Módulo inicializado com sucesso na arquitetura: ${architecture}.`);});




async function processOutput(args, tempFile) {
await ensureExecutable(HiudyyDLPath);
return new Promise((resolve, reject) => {
execFile(HiudyyDLPath, args, (err, stdout, stderr) => {
if (err) {
if (HiudyyDLPath.includes('hiudyydl_py')) {
execFile('python', [HiudyyDLPath, ...args], (pyErr, pyStdout, pyStderr) => {
if (pyErr) {
reject(`Erro ao executar com Python: ${pyStderr || pyErr.message}`);
} else {
handleFile(tempFile, resolve, reject);
}})} else {
reject(`Hiudyydl error: ${stderr || err.message}`);
}} else {
handleFile(tempFile, resolve, reject);
}})})};




async function ytmp3(input) {
const url = getVideoUrl(input);
const output = path.join(tempPath, generateRandomName("m4a"));
const args = ["-f", "bestaudio[ext=m4a]", "--cookies", cookiesPath, "-o", output, url];
return await processOutput(args, output);
};




async function ytmp4(input) {
const url = getVideoUrl(input);
const output = path.join(tempPath, generateRandomName("mp4"));
const args = ["-f", "bestvideo+bestaudio[ext=mp4]/mp4", "--cookies", cookiesPath, "-o", output, url];
return await processOutput(args, output);
};




async function alldl(input) {
const url = input.startsWith("http") ? input : getVideoUrl(input);
const results = [];
const tempPathDl = path.join(tempPath, `${Math.floor(Math.random() * 100000)}_${Math.floor(Math.random() * 100000)}`);
const outputTemplate = path.join(tempPathDl, "%(title)s_%(id)s.%(ext)s");

try {
await ensureExecutable(HiudyyDLPath);
const formatArgs = ["-F", "--cookies", cookiesPath, url];

const formats = await new Promise((resolve, reject) => {
execFile(HiudyyDLPath, formatArgs, (error, stdout) => {
if (error) return reject(error);
resolve(stdout.trim());
})});

const hasAudio = /\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(formats) || formats.includes('audio');
const hasVideo = /\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(formats) || formats.includes('video');
const hasImages = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(formats) || formats.includes('image');

const downloadArgsList = [];

if (hasVideo || !hasAudio) {
downloadArgsList.push(["-f", "bestvideo+bestaudio/best", "--merge-output-format", "mp4", "--cookies", cookiesPath, "--output", outputTemplate, "--no-warnings"]);
};

if (hasAudio) {
downloadArgsList.push(["-f", formats.includes('m4a') ? "bestaudio[ext=m4a]" : "bestaudio", "--cookies", cookiesPath, "--output", outputTemplate, "--no-warnings"]);
};

if (hasImages) {
downloadArgsList.push(["-f", "best", "--cookies", cookiesPath, "--output", outputTemplate, "--no-warnings", "--yes-playlist"]);
};

for (const args of downloadArgsList) {
await new Promise((resolve, reject) => {
execFile(HiudyyDLPath, args.concat(url), (error, stdout, stderr) => {
if (error) {
if (HiudyyDLPath.includes('hiudyydl_py')) {
execFile('python', [HiudyyDLPath, ...args, url], (pyErr, pyStdout, pyStderr) => {
if (pyErr) return reject(`Hiudyydl error: ${pyStderr || pyErr.message}`);
resolve(pyStdout.trim())});
} else {
return reject(`Hiudyydl error: ${stderr || error.message}`);
}} else {
resolve(stdout.trim());
}})})};

const files = fs.readdirSync(tempPathDl);
for (const file of files) {
const filePath = path.join(tempPathDl, file);
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
if (extension === ".pdf") mimetype = "application/pdf";
if (extension === ".doc" || extension === ".docx") mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
if (extension === ".xls" || extension === ".xlsx") mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
if (extension === ".txt") mimetype = "text/plain";
if (extension === ".ppt" || extension === ".pptx") mimetype = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
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
}
return results;
}




async function yts(query) {
const yt = await Innertube.create({ cache: new UniversalCache() });
const search = await yt.search(query);
return search;
};




module.exports = { 
ytmp3, 
ytmp4,
ytadl: ytmp3, 
ytvdl: ytmp4, 
alldl, 
yts, 
ai: ai
};