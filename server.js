const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/extract', async (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: "URL is required" });
    }

    let browser;
    try {
        // Asli Chrome browser launch karega (headless mode mein)
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled' // Bot detection bypass
            ]
        });

        const page = await browser.newPage();
        
        // Asli mobile/PC ka user-agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Link open karega aur network idle hone tak wait karega (redirect pakadne ke liye)
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Redirect hone ke baad jo aakhri URL bachega, wo nikal lega
        const finalUrl = page.url();
        
        await browser.close();
        
        res.json({ status: "success", final_url: finalUrl });

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.listen(port, () => {
    console.log(`FILEX Link Extractor running on port ${port}`);
});
