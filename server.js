const express = require("express");
const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const outputDir = path.resolve("./downloads");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const ytDlpPath = path.join(__dirname, "yt-dlp");
const ytDlpWrap = new YTDlpWrap(ytDlpPath);

// Download binary first, then start server
async function init() {
  try {
    await YTDlpWrap.downloadFromGithub(ytDlpPath);
    console.log("✅ yt-dlp binary ready");

    // 🔹 Health API
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok", uptime: process.uptime() });
    });

    app.get("/download", async (req, res) => {
      const url = req.query.url;
      if (!url) return res.status(400).send("Missing ?url=");

      const filePattern = `${outputDir}/%(title)s.%(ext)s`;

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
        res.status(500).send("Download failed");
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to initialize yt-dlp:", err);
  }
}

init();
