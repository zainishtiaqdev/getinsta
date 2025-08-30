import express from "express";
import { exec } from "yt-dlp-exec";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

const outputDir = path.resolve("./downloads");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing ?url=");

  const filePattern = `${outputDir}/%(title)s.%(ext)s`;

  try {
    await exec(url, { output: filePattern });
    const files = fs.readdirSync(outputDir);
    const latest = files.sort((a, b) =>
      fs.statSync(path.join(outputDir, b)).mtimeMs -
      fs.statSync(path.join(outputDir, a)).mtimeMs
    )[0];

    res.download(path.join(outputDir, latest)); // send file to client
  } catch (err) {
    console.error(err);
    res.status(500).send("Download failed");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running
