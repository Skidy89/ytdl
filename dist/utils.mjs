import { execFile } from "child_process";
import fs from "fs";
import os from 'os';


function detectSystemInfo(callback) {
   const architecture = os.arch();
   const platform = os.platform();
   callback(null, architecture, platform);
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
const validDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'youtube.co'];
if (!validDomains.some(domain => url.hostname.endsWith(domain))) return input;
if (url.hostname === 'youtu.be') return url.pathname.substring(1);

if (url.hostname.includes('youtube.com')) {
if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2];
if (url.searchParams.has('v')) return url.searchParams.get('v');
if (url.pathname === '/watch') return null;
if (url.pathname.startsWith('/channel/')) return null;
if (url.pathname.startsWith('/user/')) return null;
if (url.pathname.startsWith('/playlist') && url.searchParams.has('list')) return url.searchParams.get('list');
};

} catch {return input};
return input;
};


function getVideoUrl(ajsjj) {
const idzz = getYouTubeID(ajsjj) ;
return `https://www.youtube.com/watch?v=${idzz}`;
};


function ensureExecutable(filePath) {
fs.chmodSync(filePath, 0o755)
};


function handleFile(tempFile, resolve, reject) {
fs.readFile(tempFile, (readErr, buffer) => {
if (readErr) {
reject(`Error reading file: ${readErr.message}`);
} else {
fs.unlink(tempFile, (unlinkErr) => {
if (unlinkErr) console.error(`Error deleting file: ${unlinkErr.message}`);
});
resolve(buffer);
}})};


const expots = { detectSystemInfo: detectSystemInfo, generateRandomName: generateRandomName, getYouTubeID: getYouTubeID, ensureExecutable: ensureExecutable, handleFile: handleFile, getVideoUrl: getVideoUrl };

export default expots;