const express = require("express");
const YTDlpWrap = require("yt-dlp-wrap").default; // import the class
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const outputDir = path.resolve("./downloads");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create an instance and point to a binary path
const ytDlpPath = path.join(__dirname, "yt-dlp"); // or "bin/yt-dlp" if you ship it yourself
const ytDlpWrap = new YTDlpWrap(ytDlpPath);

// Download binary automatically if missing
YTDlpWrap.downloadFromGithub(ytDlpPath)
  .then(() => console.log("✅ yt-dlp binary ready"))
  .catch(err => console.error("❌ Failed to download yt-dlp:", err));

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
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
