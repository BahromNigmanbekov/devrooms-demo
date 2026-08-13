import { chromium } from "playwright";

const OUT = "C:\\Users\\User\\AppData\\Local\\Temp\\claude\\c--Users-User-Desktop-office-game-arcade-terminals-office-game\\f979128f-5d46-4d10-a00e-7b27f59961f3\\scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("PAGE ERROR:", msg.text());
});

await page.goto("http://localhost:5173");
await page.waitForSelector("text=Create one instead");
await page.click("text=Create one instead");

await page.fill("#hostNickname", "QA-Bot");
await page.click("text=Create Room");

await page.waitForSelector("text=Start Game", { timeout: 10000 });
await page.click("text=Start Game");

await page.waitForSelector("#game-canvas", { timeout: 10000 });
await page.waitForTimeout(1000); // let first frames render

await page.screenshot({ path: `${OUT}/office-room.png` });
console.log("Captured office-room.png");

// Jump straight to the park area via the temporary QA hook (bypasses the
// 12-task unlock gate, which would take a long time to solve via the script).
await page.evaluate(() => window.__game._loadArea("park"));
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/park-room.png` });
console.log("Captured park-room.png");

// Walk around briefly in the park to trigger movement animation + camera pan,
// then screenshot again for a second data point.
await page.keyboard.down("KeyD");
await page.waitForTimeout(800);
await page.keyboard.up("KeyD");
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/park-room-moved.png` });
console.log("Captured park-room-moved.png");

await browser.close();
