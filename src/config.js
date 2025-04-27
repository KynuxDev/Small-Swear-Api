const fs = require('fs');
const path = require('path');

let config;

try {
    const configPath = path.join(__dirname, '..', 'config.json');
    const configRaw = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configRaw);
    console.log("Yapılandırma dosyası başarıyla yüklendi.");
} catch (err) {
    console.error("Yapılandırma dosyası (config.json) okunamadı veya geçersiz:", err);
    process.exit(1);
}

module.exports = config;