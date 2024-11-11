"use server";
import $ from "jquery";
import puppeteer from "puppeteer";
import fs from "fs";
import { revalidatePath } from "next/cache";



export async function scrapeOlxProducts(url: string) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });

    // Add jQuery to the page context
    await page.addScriptTag({
      url: "https://code.jquery.com/jquery-3.6.0.min.js",
    });

    // Verify jQuery loaded successfully
    const isJQueryLoaded = await page.evaluate(() => !!(window as any)?.jQuery);
    if (!isJQueryLoaded) {
      throw new Error("jQuery not loaded");
    }

    const data = await page.evaluate(() => {
      const price = $("span._56dab877").text().trim();
      const title = $("h1.a38b8112").text().trim();
      const description = $("._0f86855a").text().trim();
      const features: string[] = [];

      $("._27f9c8ac")
        .children()
        .each(function () {
          features.push($(this).text().trim());
        });

      return { title, price, description, features };
    });

    await browser.close();
    revalidatePath("/"); // Revalidate cache if necessary
    return { ...data, url };
  } catch (error) {
    console.error("Scraping error:", error);
    return null;
  }
}

export async function exportData(data: any) {
  try {
    const jsonContent = JSON.stringify(data, null, 4);
    fs.writeFile("myData.json", jsonContent, "utf8", (err) => {
      if (err) {
        console.error("An error occurred while writing JSON to a file.");
        return console.error(err);
      }

      console.log("JSON file has been saved.");
    });
  } catch (error) {
    console.error(error);
  }
}