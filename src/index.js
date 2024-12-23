const { detectSystemInfo, generateRandomName, getYouTubeID, ensureExecutable, handleFile, getVideoUrl } = require('./../dist/utils.js');
const { Innertube, UniversalCache } = require("youtubei.js");
const { execFile, exec } = require("child_process");
const ai = require('./ia/index.js');
const path = require("path");
const fs = require("fs");
const os = require("os");
const fetch = require('node-fetch');




(async () => {
  const binPath = path.join(__dirname, '../bin/');
  const repos = [
    {
      repo: 'yt-dlp/yt-dlp',
      versionFile: path.join(binPath, 'version.txt'),
      files: [
        { suffix: 'yt-dlp', name: 'hiudyydl_py', platforms: ['android'] },
        { suffix: 'yt-dlp_linux', name: 'hiudyydl', platforms: ['linux', 'x64'] },
        { suffix: 'yt-dlp_linux_aarch64', name: 'hiudyydl_64', platforms: ['linux', 'aarch64'] },
        { suffix: 'yt-dlp_linux_armv7l', name: 'hiudyydl_v7', platforms: ['linux', 'arm'] },
        { suffix: 'yt-dlp.exe', name: 'hiudyydl_win.exe', platforms: ['win32'] },
        { suffix: 'yt-dlp_windows_x86.zip', name: 'hiudyydl_win_x86.zip', platforms: ['win32', 'x86'] },
        { suffix: 'yt-dlp_windows_x64.zip', name: 'hiudyydl_win_x64.zip', platforms: ['win32', 'x64'] }
      ]
    }
  ];
  fs.mkdirSync(binPath, { recursive: true });
  const platform = os.platform();
  const arch = os.arch();
  for (const { repo, versionFile, files } of repos) {
    const { tag_name, assets } = await fetch(`https://api.github.com/repos/${repo}/releases/latest`).then(r => r.json());
    const localVersion = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : null;
    if (localVersion === tag_name) {
      continue;
    }
    let selectedFile = null;
    for (const { suffix, name, platforms } of files) {
      if (platforms.includes(platform) && (platform !== 'linux' || platforms.includes(arch))) {
        selectedFile = { suffix, name };
        break;
      }
    }
    if (!selectedFile) {
      continue;
    }
    const { suffix, name } = selectedFile;
    const asset = assets.find(a => a.name.endsWith(suffix));
    if (asset) {
      const filePath = path.join(binPath, name);
      fs.readdirSync(binPath).forEach(file => {
        if (file !== name) fs.unlinkSync(path.join(binPath, file));
      });
      console.log(`⚠️ [INFO] Baixando a biblioteca`);
      await fetch(asset.browser_download_url).then(r => r.body.pipe(fs.createWriteStream(filePath)));
      console.log(`✅ [SUCESSO] Binário baixado e salvo como: ${name}`);
    } else {
      console.error(`❌ [ERRO] Asset não encontrado para o binário: ${suffix}`);
    }
    fs.writeFileSync(versionFile, tag_name);
    console.log(`⚠️ [INFO] Repositório atualizado para a versão: ${tag_name}`);
  }
})();

const cookiesPath = path.join(__dirname, "../bin/cookies.txt");
const tempPath = path.join(__dirname, "../temp");
const tempDirSystem = os.tmpdir();
let HiudyyDLPath = '';

async function clearSystemTempDir() {
  try {
    exec(`rm -rf ${tempDirSystem}/*`, (err) => {
    });
    exec(`rm ${tempDirSystem}/*`, (err) => {
    });
  } catch (error) {
    console.error(`[ERRO] Falha ao limpar diretório temporário: ${error.message}`);
  }
  return true;
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
await clearSystemTempDir();
const url = getVideoUrl(input);
const output = path.join(tempPath, generateRandomName("m4a"));
const args = ["--no-cache-dir", "-f", "bestaudio[ext=m4a]", "--cookies", cookiesPath, "-o", output, url];
return await processOutput(args, output);
};




async function ytmp4(input) {
await clearSystemTempDir();
const url = getVideoUrl(input);
const output = path.join(tempPath, generateRandomName("mp4"));
const args = ["--no-cache-dir", "-f", "bestvideo+bestaudio[ext=mp4]/mp4", "--cookies", cookiesPath, "-o", output, url];
return await processOutput(args, output);
};




async function alldl(input) {
await clearSystemTempDir();
const url = input.startsWith("http") ? input : getVideoUrl(input);
const results = [];
const tempPathDl = path.join(tempPath, `${Math.floor(Math.random() * 100000)}_${Math.floor(Math.random() * 100000)}`);
const outputTemplate = path.join(tempPathDl, "%(title)s_%(id)s.%(ext)s");

try {
await ensureExecutable(HiudyyDLPath);
const formatArgs = ["--no-cache-dir", "-F", "--cookies", cookiesPath, url];

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
downloadArgsList.push(["--no-cache-dir", "-f", "bestvideo+bestaudio/best", "--merge-output-format", "mp4", "--cookies", cookiesPath, "--output", outputTemplate, "--no-warnings"]);
};

if (hasAudio) {
downloadArgsList.push(["--no-cache-dir", "-f", formats.includes('m4a') ? "bestaudio[ext=m4a]" : "bestaudio", "--cookies", cookiesPath, "--output", outputTemplate, "--no-warnings"]);
};

if (hasImages) {
downloadArgsList.push(["--no-cache-dir", "-f", "best", "--cookies", cookiesPath, "--output", outputTemplate, "--no-warnings", "--yes-playlist"]);
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
await clearSystemTempDir();
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