const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { normalizeWord } = require('./src/utils');
const config = require('./src/config');
const wordlistLoader = require('./src/wordlistLoader');
const apiRoutes = require('./src/routes/api');

const app = express();
const port = process.env.PORT || config.server.port || 3000;

app.use(helmet());
app.disable('x-powered-by');

const apiLimiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.maxRequests,
    message: {
        success: false,
        error: `Çok fazla istek yapıldı, lütfen ${config.security.rateLimit.windowMs / 60000} dakika sonra tekrar deneyin.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);


app.use('/api', apiRoutes);


app.get('/', (req, res) => {
    const maxTextLength = config.security.maxTextLength;
    const rateLimitWindowMin = config.security.rateLimit.windowMs / 60000;
    const maxRequests = config.security.rateLimit.maxRequests;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
        <h1>Küfür Algılama API</h1>
        <p>Bu API, sağlanan metin içinde Türkçe küfürleri algılar.</p>
        <h2>Kullanım:</h2>
        <p><code>/api/swear/detect?text=METIN[&censor=true][&matchInside=true][&sensitivity=normal]</code></p>
        <ul>
            <li><b>text</b> (Zorunlu): Analiz edilecek metin (Max ${maxTextLength} karakter).</li>
            <li><b>censor</b> (İsteğe bağlı): <code>true</code> veya <code>1</code> ise bulunan küfürler sansürlenir (<code>*</code> ile değiştirilir).</li>
            <li><b>matchInside</b> (İsteğe bağlı, <code>sensitivity=normal</code> ise geçerli): <code>true</code> veya <code>1</code> ise kelimelerin *içinde* geçen küfürler de aranır (örn: "lanetolsun" içindeki "lan"). Yanlış pozitiflere neden olabilir.</li>
            <li><b>sensitivity</b> (İsteğe bağlı): Algılama hassasiyeti. Varsayılan: <code>normal</code>.
                <ul>
                    <li><code>exact</code>: Sadece tam kelime eşleşmesi (normalize edilmiş). <code>matchInside</code> yoksayılır.</li>
                    <li><code>normal</code>: Tam kelime eşleşmesi. <code>matchInside=true</code> ise kelime içi arama da yapılır.</li>
                    <li><code>aggressive</code>: Tam kelime eşleşmesi VE her zaman kelime içi arama yapılır. <code>matchInside</code> yoksayılır.</li>
                </ul>
            </li>
        </ul>
        <h2>Örnekler:</h2>
        <ul>
            <li><a href="/api/swear/detect?text=bu+çok+boktan+bir+durum">/api/swear/detect?text=bu+çok+boktan+bir+durum</a></li>
            <li><a href="/api/swear/detect?text=hassiktir+lan&censor=true">/api/swear/detect?text=hassiktir+lan&censor=true</a></li>
            <li><a href="/api/swear/detect?text=lanetolsun+bu+işe&matchInside=true&censor=true">/api/swear/detect?text=lanetolsun+bu+işe&matchInside=true&censor=true</a> (Normal sensitivity ile aynı)</li>
            <li><a href="/api/swear/detect?text=lanetolsun+bu+işe&sensitivity=exact">/api/swear/detect?text=lanetolsun+bu+işe&sensitivity=exact</a> ('lan' bulunmaz)</li>
            <li><a href="/api/swear/detect?text=lanetolsun+bu+işe&sensitivity=aggressive&censor=true">/api/swear/detect?text=lanetolsun+bu+işe&sensitivity=aggressive&censor=true</a> ('lan' bulunur ve sansürlenir)</li>
       </ul>
       <hr>
        <p><em>Not: Rate limit ${rateLimitWindowMin} dakikada ${maxRequests} istektir.</em></p>
    `);
});


app.use((err, req, res, next) => {
    console.error("Beklenmeyen bir sunucu hatası oluştu:", err.stack || err);
    res.status(500).json({
        success: false,
        error: 'Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    });
});


async function startServer() {
    try {
        await wordlistLoader.initializeWordLists();
        const hostname = config.server.hostname || 'localhost';
        app.listen(port, hostname, () => {
            console.log(`Küfür algılama API'si http://${hostname}:${port} adresinde çalışıyor`);
            console.log(`API Anasayfası: http://${hostname}:${port}/`);
        });
    } catch (err) {
        console.error("Uygulama başlatılırken kritik hata:", err);
        process.exit(1);
    }
}

startServer();