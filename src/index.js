const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Innertube, UniversalCache } = require("youtubei.js");

const ytdlpPath = path.join(__dirname, "../bin/yt-dlp");
const cookiesPath = path.join(__dirname, "../bin/cookies.txt");
const tempPath = path.join(__dirname, "../temp");

function generateRandomName(extension) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `${timestamp}_${random}.${extension}`;
}

function getVideoUrl(input) {
  return input.startsWith("http") ? input : `https://www.youtube.com/watch?v=${input}`;
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
        reject(`yt-dlp error: ${stderr || err.message}`);
      } else {
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
    });
  });
}

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

async function ytadlV2(input) {
  const yt = await Innertube.create();
  const url = getVideoUrl(input);
  const streamInfo = await yt.getBasicInfo(url);

  const audioStream = streamInfo.streaming_data.adaptive_formats.find(
    (format) => format.mime_type.includes("audio/mp4")
  );

  if (!audioStream) throw new Error("No audio stream found!");

  const output = path.join(tempPath, generateRandomName("m4a"));
  const audioStreamUrl = audioStream.url;

  const audioResponse = await fetch(audioStreamUrl);
  const buffer = Buffer.from(await audioResponse.arrayBuffer());

  return buffer;
}

async function ytvdlV2(input) {
  const yt = await Innertube.create();
  const url = getVideoUrl(input);
  const streamInfo = await yt.getBasicInfo(url);

  const videoStream = streamInfo.streaming_data.adaptive_formats.find(
    (format) => format.mime_type.includes("video/mp4") && format.quality_label === "720p"
  );

  if (!videoStream) throw new Error("No video stream found!");

  const output = path.join(tempPath, generateRandomName("mp4"));
  const videoStreamUrl = videoStream.url;

  const videoResponse = await fetch(videoStreamUrl);
  const buffer = Buffer.from(await videoResponse.arrayBuffer());

  return buffer;
}

async function yts(query) {
  const yt = await Innertube.create({ cache: new UniversalCache() });
  const search = await yt.search(query);
  return search;
}

module.exports = { ytadl, ytvdl, ytadlV2, ytvdlV2, yts };