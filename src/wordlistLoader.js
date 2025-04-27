const fs = require('fs').promises;
const path = require('path');
const config = require('./config');
const { normalizeWord } = require('./utils');

let swearWords = new Set();
let categorizedSwearWords = new Map();
let whitelistWords = new Set();

async function loadWhitelistWords() {
    const whitelistPath = path.join(__dirname, '..', config.swearDetection.whitelistFile);
    if (!config.swearDetection.whitelistFile) {
        console.log("Yapılandırmada beyaz liste dosyası belirtilmemiş, beyaz liste özelliği devre dışı.");
        return;
    }
    try {
        const data = await fs.readFile(whitelistPath, 'utf8');
        const words = data.split(/\r?\n/);
        const loadedWhitelist = new Set(
            words
                .map(word => normalizeWord(word.trim()))
                .filter(word => word)
        );
        whitelistWords = loadedWhitelist;
        console.log(`Başarıyla ${whitelistWords.size} adet beyaz liste kelimesi '${config.swearDetection.whitelistFile}' dosyasından yüklendi.`);
    } catch (err) {
        if (err.code === 'ENOENT') {
             console.log(`Beyaz liste dosyası ('${config.swearDetection.whitelistFile}') bulunamadı. Beyaz liste boş kabul ediliyor.`);
             whitelistWords = new Set();
        } else {
            console.error(`Beyaz liste ('${config.swearDetection.whitelistFile}') yüklenirken hata oluştu:`, err);
             whitelistWords = new Set();
        }
    }
}

async function loadSwearWords() {
    if (config.swearDetection.useCategorizedList) {
        const categorizedListPath = path.join(__dirname, '..', config.swearDetection.categorizedWordlistFile);
        try {
            const data = await fs.readFile(categorizedListPath, 'utf8');
            const loadedCategories = JSON.parse(data);
            const loadedCategorizedMap = new Map();
            let count = 0;
            for (const word in loadedCategories) {
                const normalizedWord = normalizeWord(word);
                if (normalizedWord) {
                    loadedCategorizedMap.set(normalizedWord, loadedCategories[word]);
                    count++;
                }
            }
            categorizedSwearWords = loadedCategorizedMap;
            swearWords = new Set(categorizedSwearWords.keys());
            console.log(`Başarıyla ${count} adet kategorili küfür kelimesi '${config.swearDetection.categorizedWordlistFile}' dosyasından yüklendi.`);
            if (count === 0) {
                console.warn(`Uyarı: Kategorili küfür listesi ('${config.swearDetection.categorizedWordlistFile}') boş veya yüklenemedi.`);
            }
        } catch (err) {
            console.error(`Kategorili küfür listesi ('${config.swearDetection.categorizedWordlistFile}') yüklenirken hata oluştu:`, err);
            swearWords = new Set();
            categorizedSwearWords = new Map();
        }
    } else {
        const simpleListPath = path.join(__dirname, '..', config.swearDetection.simpleWordlistFile);
         if (!config.swearDetection.simpleWordlistFile) {
             console.warn("Yapılandırmada basit kelime listesi dosyası ('simpleWordlistFile') belirtilmemiş. Küfür algılama çalışmayabilir.");
             swearWords = new Set();
             return;
         }
        try {
            const data = await fs.readFile(simpleListPath, 'utf8');
            const words = data.split(/\r?\n/);
            const loadedSimpleSet = new Set(
                 words
                    .map(word => normalizeWord(word.trim()))
                    .filter(word => word)
            );
            swearWords = loadedSimpleSet;
            categorizedSwearWords = new Map();
            console.log(`Başarıyla ${swearWords.size} adet basit küfür kelimesi '${config.swearDetection.simpleWordlistFile}' dosyasından yüklendi.`);
            if (swearWords.size === 0) {
                console.warn(`Uyarı: Basit küfür listesi ('${config.swearDetection.simpleWordlistFile}') boş veya yüklenemedi.`);
            }
        } catch (err) {
            console.error(`Basit küfür listesi ('${config.swearDetection.simpleWordlistFile}') yüklenirken hata oluştu:`, err);
            swearWords = new Set();
            categorizedSwearWords = new Map();
        }
    }
}

async function initializeWordLists() {
    await Promise.all([loadSwearWords(), loadWhitelistWords()]);
    console.log("Kelime listeleri yükleme işlemi tamamlandı.");
}

module.exports = {
    initializeWordLists,
    getSwearWords: () => swearWords,
    getCategorizedSwearWords: () => categorizedSwearWords,
    getWhitelistWords: () => whitelistWords,
};