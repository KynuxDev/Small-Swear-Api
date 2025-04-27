const express = require('express');
const router = express.Router();

const { normalizeWord } = require('../utils');
const config = require('../config');
const wordlistLoader = require('../wordlistLoader');

router.get('/swear/detect', (req, res, next) => {
  try {
    const currentSwearWords = wordlistLoader.getSwearWords();
    const currentCategorizedSwearWords = wordlistLoader.getCategorizedSwearWords();
    const currentWhitelistWords = wordlistLoader.getWhitelistWords();

    const text = req.query.text;
    const censorQuery = req.query.censor;
    const matchInsideQuery = req.query.matchInside;
    const sensitivityQuery = req.query.sensitivity;

    const shouldCensor = ['true', '1'].includes(String(censorQuery).toLowerCase());

    let sensitivity = 'normal';
    const validSensitivities = ['exact', 'normal', 'aggressive'];
    if (sensitivityQuery && validSensitivities.includes(String(sensitivityQuery).toLowerCase())) {
        sensitivity = String(sensitivityQuery).toLowerCase();
    }

    let useEffectiveMatchInside = false;
    if (sensitivity === 'aggressive') {
        useEffectiveMatchInside = true;
    } else if (sensitivity === 'normal') {
        useEffectiveMatchInside = ['true', '1'].includes(String(matchInsideQuery).toLowerCase());
    }

    const MAX_TEXT_LENGTH = config.security.maxTextLength;

    if (!text) {
        return res.status(400).json({
            success: false,
            error: 'Eksik zorunlu query parametresi: text'
        });
    }

    if (text.length > MAX_TEXT_LENGTH) {
        return res.status(413).json({
            success: false,
            error: `Metin uzunluğu ${MAX_TEXT_LENGTH} karakteri aşamaz.`
        });
    }

    const parts = text.split(/(\s+|[.,?;:()"'-])/);
    const detectedSwearsDetails = [];
    let detectedCategories = new Set();
    let censoredTextParts = [];
    let containsSwear = false;
    let wordCount = 0;

    parts.forEach(part => {
        if (!part) return;

        const isWord = !/^\s+$|^[.,!?;:()"'-]$/.test(part);
        let processedPart = part;

        if (isWord) {
            wordCount++;
            const lowerCasePart = part.toLowerCase();
            const normalizedPart = normalizeWord(lowerCasePart);

            let foundSwearInPart = false;
            let foundCategory = null;
            const isWhitelisted = currentWhitelistWords.has(normalizedPart);

            if (!isWhitelisted) {
                const isInList = config.swearDetection.useCategorizedList
                    ? currentCategorizedSwearWords.has(normalizedPart)
                    : currentSwearWords.has(normalizedPart);

                let isExactMatch = false;
                if (isInList) {
                    isExactMatch = true;
                    foundSwearInPart = true;
                    foundCategory = config.swearDetection.useCategorizedList
                                    ? currentCategorizedSwearWords.get(normalizedPart) || 'bilinmiyor'
                                    : 'bilinmiyor';
                    detectedSwearsDetails.push({ word: part, category: foundCategory, reason: 'tam' });
                    detectedCategories.add(foundCategory);
                    containsSwear = true;
                }

                if (!isExactMatch && useEffectiveMatchInside) {
                    for (const swear of currentSwearWords) {
                         if (currentWhitelistWords.has(swear)) continue;

                        const MIN_INSIDE_LENGTH = 3;
                        if (swear.length >= MIN_INSIDE_LENGTH && normalizedPart.includes(swear)) {
                             if (!currentWhitelistWords.has(swear)) {
                                foundSwearInPart = true;
                                foundCategory = config.swearDetection.useCategorizedList
                                                ? currentCategorizedSwearWords.get(swear) || 'bilinmiyor'
                                                : 'bilinmiyor';
                                detectedSwearsDetails.push({ word: part, category: foundCategory, reason: `içeriyor: ${swear}` });
                                detectedCategories.add(foundCategory);
                                containsSwear = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (foundSwearInPart && shouldCensor) {
                processedPart = '*'.repeat(part.length);
            }
        }
        censoredTextParts.push(processedPart);
    });

    const categoryCounts = {};
    detectedSwearsDetails.forEach(detail => {
        categoryCounts[detail.category] = (categoryCounts[detail.category] || 0) + 1;
    });
    const detectedSwearCount = detectedSwearsDetails.length;
    const swearDensity = wordCount > 0 ? detectedSwearCount / wordCount : 0;

    const response = {
        success: true,
        query: {
            text: text,
            censor: shouldCensor,
            match_inside_requested: ['true', '1'].includes(String(matchInsideQuery).toLowerCase()),
            sensitivity: sensitivity,
            match_inside_effective: useEffectiveMatchInside,
            provided_length: text.length,
        },
        analysis: {
            contains_swear: containsSwear,
            detected_swears: detectedSwearsDetails,
            detected_swear_count: detectedSwearCount,
            detected_categories: Array.from(detectedCategories),
            category_counts: categoryCounts,
            word_count: wordCount,
            swear_density: parseFloat(swearDensity.toFixed(4)),
        }
    };

    if (shouldCensor) {
        response.censored_text = censoredTextParts.join('');
    }

    res.json(response);

  } catch (error) {
      console.error("API rotasında (/swear/detect) beklenmedik hata:", error);
      next(error);
  }
});

module.exports = router;