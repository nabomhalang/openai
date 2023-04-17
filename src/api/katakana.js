const kuroshiro = require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

async function initKuroshiro() {
    await kuroshiro.init(new KuromojiAnalyzer());
}

initKuroshiro();

function isAlpha(str) {
    return /^[a-zA-Z]+$/.test(str);
}

async function katakanaConverter(text) {
    const words = text.split(' ');
    const wordsWithAlpha = words.filter((word) => isAlpha(word));

    for (const word of wordsWithAlpha) {
        const katakana = await kuroshiro.convert(word, {
            to: 'katakana',
            mode: 'furigana',
            romajiSystem: 'passport',
        });
        text = text.replace(word, katakana);
    }

    return text;
}

(async () => {
    const result = await katakanaConverter("Hello, my name is John.");
    console.log(result);
})();
