import puppeteer, { PDFOptions } from "puppeteer";

export class PdfExporter {
  async export(html: string, opts: PDFOptions = {}): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfData = await page.pdf({
        format: "A4",
        printBackground: true,
        ...opts,
      });

      return Buffer.from(pdfData);
    } finally {
      await browser.close();
    }
  }
}
