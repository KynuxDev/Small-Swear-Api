function normalizeWord(word) {
    if (!word) return '';
    let normalized = word.toLowerCase();
    normalized = normalized.replace(/[ş]/g, 's');
    normalized = normalized.replace(/[ç]/g, 'c');
    normalized = normalized.replace(/[ğ]/g, 'g');
    normalized = normalized.replace(/[ü]/g, 'u');
    normalized = normalized.replace(/[ö]/g, 'o');
    normalized = normalized.replace(/[ı]/g, 'i');

    normalized = normalized.replace(/[!1¡l]/g, 'i');
    normalized = normalized.replace(/[@4]/g, 'a');
    normalized = normalized.replace(/[3€]/g, 'e');
    normalized = normalized.replace(/[0ö]/g, 'o');
    normalized = normalized.replace(/[5$§s]/g, 's');
    normalized = normalized.replace(/[7]/g, 't');
    normalized = normalized.replace(/[2z]/g, 'z');


    normalized = normalized.replace(/(.)\1+/g, '$1');
    return normalized;
}

module.exports = {
    normalizeWord
};