const { spawn } = require("child_process");
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

async function processOutput(args, tempFile) {
  return new Promise((resolve, reject) => {
    const process = spawn(ytdlpPath, args);

    process.on("error", (err) => reject(`yt-dlp error: ${err.message}`));
    process.stderr.on("data", (data) => {
      console.error(`yt-dlp error: ${data}`);
    });
    process.on("close", (code) => {
      if (code === 0) {
        fs.readFile(tempFile, (err, buffer) => {
          if (err) {
            reject(`Error reading file: ${err.message}`);
          } else {
            // Exclui o arquivo após ler o buffer
            fs.unlink(tempFile, (unlinkErr) => {
              if (unlinkErr) {
                console.error(`Error deleting file: ${unlinkErr.message}`);
              }
            });
            resolve(buffer);
          }
        });
      } else {
        reject(`yt-dlp failed with exit code ${code}`);
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

async function yts(query) {
  const yt = await Innertube.create({ cache: new UniversalCache() });
  const search = await yt.search(query);
  return search;
}

module.exports = { ytadl, ytvdl, yts };