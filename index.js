const { config } = require("dotenv");
const { exec } = require("yt-dlp-exec");
const path = require("path");

config();

const videoUrl = process.env.INSTA_URL;
if (!videoUrl) {
  console.error("❌ Please set INSTA_URL in .env file");
  process.exit(1);
}

const outputDir = path.resolve("./downloads");

// Run yt-dlp with progress enabled
const ytdlp = exec(videoUrl, {
  output: `${outputDir}/%(title)s.%(ext)s`,
  progress: true, // enables progress output
}, { stdio: ["ignore", "pipe", "pipe"] });

// Capture stdout (progress info comes here)
ytdlp.stdout.on("data", (data) => {
  const message = data.toString();
  process.stdout.write(message); // print progress in realtime
});

// Capture stderr (yt-dlp also writes some progress here)
ytdlp.stderr.on("data", (data) => {
  const message = data.toString();
  process.stdout.write(message); // also log progress/errors
});

// Handle exit
ytdlp.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Download complete!");
  } else {
    console.error(`\n❌ Download failed with exit code ${code}`);
  }
});
