const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Neon Blue Dark Theme UI (FILEX / 4K•SJ STORE)
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>4K•SJ Link Extractor</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0d1117; color: #00ffff; padding: 2rem; display: flex; justify-content: center; }
        .container { width: 100%; max-width: 600px; background: #161b22; padding: 2rem; border-radius: 12px; border: 1px solid #00ffff; box-shadow: 0 0 15px rgba(0, 255, 255, 0.2); }
        h2 { text-align: center; margin-bottom: 20px; }
        input[type="text"] { width: 95%; padding: 12px; margin-bottom: 20px; border: 1px solid #30363d; background: #0d1117; color: #fff; border-radius: 6px; outline: none; }
        input[type="text"]:focus { border-color: #00ffff; }
        button { width: 100%; background-color: #00ffff; color: #000; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.3s; }
        button:hover { background-color: #00cccc; box-shadow: 0 0 10px #00ffff; }
        .result { margin-top: 20px; word-wrap: break-word; background: #0d1117; padding: 15px; border-radius: 6px; border: 1px dashed #00ffff; display: none; }
        .loader { color: #fff; text-align: center; display: none; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>FILEX / 4K•SJ Link Extractor</h2>
        <form id="extractForm">
            <input type="text" id="urlInput" placeholder="Enter original link (e.g., http://line.hdsj.store:8080/...)" required>
            <button type="submit">Extract Final Link</button>
        </form>
        <div id="loader" class="loader">Extracting redirect path with Puppeteer... Please wait 5-10s.</div>
        <div id="resultBox" class="result"></div>
    </div>
    <script>
        document.getElementById('extractForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('urlInput').value;
            const resBox = document.getElementById('resultBox');
            const loader = document.getElementById('loader');
            
            resBox.style.display = 'none';
            loader.style.display = 'block';
            
            try {
                // Fetch direct from the GET API
                const response = await fetch('/api/extract?url=' + encodeURIComponent(url));
                const data = await response.json();
                loader.style.display = 'none';
                resBox.style.display = 'block';
                
                if(data.status === 'success') {
                    resBox.innerHTML = '<strong>Final Link:</strong><br><br><a href="' + data.final_url + '" target="_blank" style="color:#00ffff; text-decoration:none;">' + data.final_url + '</a>';
                } else {
                    resBox.innerHTML = '<span style="color:#ff4444">Error: ' + (data.message || data.error) + '</span>';
                }
            } catch (err) {
                loader.style.display = 'none';
                resBox.style.display = 'block';
                resBox.innerHTML = '<span style="color:#ff4444">Network or Server Error.</span>';
            }
        });
    </script>
</body>
</html>
`;

// Homepage UI Route
app.get('/', (req, res) => {
    res.send(HTML_TEMPLATE);
});

// Extractor API Route
app.get('/api/extract', async (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: "URL is required" });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
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
