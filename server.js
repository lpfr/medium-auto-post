// ✅ 修复版 server.js for Railway 部署
// 自动使用 Railway 分配的 PORT，避免构建超时错误

const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
app.use(express.json());

app.post("/publish", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).send("❌ Title or content missing.");
  }

  console.log("🚀 Launching Puppeteer...");

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./user_data",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://medium.com/new-story", { waitUntil: "networkidle2" });

  try {
    await page.waitForSelector('div[contenteditable="true"]', { timeout: 20000 });
    const editableAreas = await page.$$('div[contenteditable="true"]');

    if (editableAreas.length >= 1) {
      await editableAreas[0].click();
      await page.keyboard.type(title);
    }
    if (editableAreas.length >= 2) {
      await editableAreas[1].click();
      await page.keyboard.type(content);
    }

    const [publishBtn] = await page.$x("//button[.//span[contains(text(), 'Publish')]]");
    if (publishBtn) {
      await publishBtn.click();
      await page.waitForXPath("//span[contains(text(), 'Publish now')]", { timeout: 10000 });
      await page.keyboard.press("Enter");
    }

    res.send("✅ Article published!");
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).send("❌ Failed to publish: " + err.message);
  }
});

// ✅ 修复关键：动态监听 Railway 提供的 PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Medium publisher listening on port ${PORT}`));
