const express = require("express");
const YTDlpWrap = require("yt-dlp-wrap").default;
const ytDlpStatic = require("yt-dlp-static");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

const outputDir = path.resolve("./downloads");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Use standalone binary from yt-dlp-static
const ytDlpPath = ytDlpStatic;
const ytDlpWrap = new YTDlpWrap(ytDlpPath);

// Binary is always ready
let ytDlpReady = true;

// 🔹 Health API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), ytDlpReady });
});

// 🔹 Download API
app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing ?url=");

  if (!ytDlpReady)
    return res
      .status(503)
      .send("yt-dlp binary is not ready yet. Try again in a few seconds.");

  const filePattern = path.join(outputDir, "%(title)s.%(ext)s");

  try {
    await ytDlpWrap.execPromise([url, "-o", filePattern]);

    const files = fs.readdirSync(outputDir);
    const latest = files.sort(
      (a, b) =>
        fs.statSync(path.join(outputDir, b)).mtimeMs -
        fs.statSync(path.join(outputDir, a)).mtimeMs
    )[0];

    res.download(path.join(outputDir, latest));
  } catch (err) {
    console.error("❌ Download failed:", err);
    res
      .status(500)
      .send(
        "Download failed. Make sure the URL is public and accessible without login."
      );
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
