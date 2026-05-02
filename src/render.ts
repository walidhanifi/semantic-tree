export async function renderPageHTML(url: string): Promise<string> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 10000,
    });

    return await page.content();
  } finally {
    await browser.close();
  }
}
