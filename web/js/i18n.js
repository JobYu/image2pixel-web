/**
 * image2pixel - Client-side i18n (en / zh-CN / zh-TW)
 */
(function () {
    const STORAGE_KEY = 'image2pixel_locale';
    const SUPPORTED = ['en', 'zh-CN', 'zh-TW'];

    const messages = {
        en: {
            'meta.title': 'Pixel Art Converter - Turn Images to Pixel Art | image2pixel',
            'meta.description':
                'Turn your images into pixel art with image2pixel, a powerful pixel art converter software. Convert any image to pixel art style easily. Try it now!',
            'meta.ogTitle': 'Pixel Art Converter - image2pixel',
            'meta.ogDescription':
                'Turn your images into pixel art with this powerful and easy-to-use software.',
            'menu.title': 'MENU',
            'nav.converter': 'Pixel Art Converter',
            'nav.font': 'Pixel Font',
            'nav.support': 'Support',
            'hero.title': 'Convert Image to Pixel Art',
            'hero.description':
                'The Pixel Art Converter instantly converts images to pixel art and photos to pixelated graphics.',
            'control.blockSize': 'Block Size:',
            'control.colorCount': 'Color Count:',
            'control.showGrid': 'Show Grid',
            'control.openImage': 'Open Image',
            'preview.original': 'Original Image',
            'preview.pixelArt': 'Pixel Art',
            'preview.placeholder': 'Click + Open image to start',
            'preview.blueprint': 'Blueprint',
            'preview.oneToOne': '1:1',
            'preview.oneToOneHint': 'Save with one pixel per color block',
            'title.menu': 'Menu',
            'title.open': 'Open',
            'title.palette': 'Palette',
            'title.save': 'Save',
            'title.print': 'Print',
            'content.howToTitle': 'How to Use Pixel Art Converter',
            'content.step1':
                '<strong>Upload:</strong> Click the "Open" button in the Original Image box to select an image. We support JPG, PNG, and WebP formats.',
            'content.step2':
                '<strong>Adjust:</strong> Use the "Block Size" slider to control the pixel density. A larger block size creates a more abstract, retro look.',
            'content.step3':
                '<strong>Palette:</strong> Choose from dozens of built-in palettes like GameBoy or NES to give your art an authentic retro feel.',
            'content.step4':
                '<strong>Export:</strong> Once satisfied, click "Save" in the Pixel Art box to download your masterpiece as a PNG file.',
            'content.whyTitle': 'Why Use Our Pixel Art Maker?',
            'content.whyBody':
                'Our online <strong>pixel art converter</strong> uses advanced quantization algorithms to transform any photo into stunning pixelated graphics. It\'s the perfect tool for creating <strong>perler bead patterns</strong> (拼豆圖紙), 8-bit game assets, or unique digital art. Whether you\'re a game developer looking for placeholder assets, or a DIY enthusiast designing <strong>fuse bead templates</strong>, image2pixel provides the tools you need.',
            'faq.title': 'Frequently Asked Questions',
            'faq.q1': 'Is this pixel art tool free to use?',
            'faq.a1':
                'Yes! image2pixel is a free online tool for everyone. We also offer a full desktop version on Steam for professional users who need batch processing and more advanced features.',
            'faq.q2': 'How do I get the best results?',
            'faq.a2':
                'Start with images that have clear subjects and high contrast. Avoid images with too much fine detail or noise, as they may look cluttered when pixelated.',
            'faq.q3': 'What does the Palette option do?',
            'faq.a3':
                'The palette option forces the converter to use a specific set of colors. This is essential for creating art that looks like it belongs on specific vintage hardware like the Atari 2600 or the original GameBoy.',
            'faq.q4': 'Which perler bead brands are supported?',
            'faq.a4':
                'We currently support 7 built-in fuse bead palettes from popular brands: <strong>Perler</strong>, <strong>Perler Mini</strong>, <strong>Hama Midi</strong>, <strong>Hama Mini</strong>, <strong>Nabbi</strong>, <strong>Artkal S (5mm)</strong>, and <strong>Artkal C (2.6mm)</strong>. Click the palette button in the result panel and scroll down to the "Fuse Bead Palettes" section to choose a brand.',
            'faq.q5': 'How do I export a perler bead blueprint?',
            'faq.a5':
                'After uploading an image and selecting a fuse bead palette (e.g., Perler or Hama), a <strong>Blueprint</strong> checkbox appears in the result panel header. Check it, then click <strong>Save</strong>. The downloaded PNG will be a numbered grid where each cell shows the bead\'s official color code, perfect for following while building your project.',
            'faq.q6': 'How do I save a true 1:1 pixel art file?',
            'faq.a6':
                'Check the <strong>1:1</strong> checkbox in the result panel, then click <strong>Save</strong>. The downloaded PNG uses one physical pixel per color block—ideal for game sprites, further upscaling, or importing into other pixel tools. The on-screen preview stays large for easier viewing.',
            'footer.steam': 'Steam',
            'footer.chromeExtension': 'Chrome Extension',
            'footer.help': 'Help',
            'footer.copyright': 'All rights reserved.',
            'footer.iosTerms': 'iOS Terms',
            'footer.androidTerms': 'Android Terms',
            'footer.privacy': 'Privacy Policy',
            'footer.chromePrivacy': 'Chrome Extension Privacy Policy',
            'footer.support': 'Support',
            'modal.choosePalette': 'Choose Palette',
            'modal.auto': 'Auto (No Palette)',
            'modal.upload': 'Upload Custom Palette',
            'modal.hint': 'Supports: .gpl (GIMP), .json, .hex, .txt',
            'loading.processing': 'Processing...',
            'palette.label': 'Palette: {name}',
            'palette.customSection': 'Custom Palettes',
            'palette.builtinSection': 'Built-in Palettes',
            'palette.deleteTitle': 'Delete custom palette',
            'palette.deleteConfirm': 'Delete custom palette "{id}"?',
            'palette.overwriteConfirm': 'Palette "{id}" already exists. Overwrite?',
            'palette.parseError': 'Failed to parse palette file: {message}',
            'palette.fuseBeadDesc': 'Fuse Bead Palette',
            'bead.patternFailed': 'Failed to generate bead pattern',
            'bead.patternTitle': '{brand} Pattern',
            'font.meta.title': 'Pixel Font Generator - Create Pixel Art Text | image2pixel',
            'font.meta.description':
                'Generate pixel art text with image2pixel\'s pixel font generator. Create retro 8-bit style text easily. Try it now!',
            'font.hero.title': 'Pixel Font Generator',
            'font.hero.description': 'Type your message and transform it into a stunning pixel art masterpiece.',
            'font.placeholder': 'Type your text here...',
            'font.control.size': 'Font Size:',
            'font.control.color': 'Text Color:',
            'font.preview.title': 'Text Preview',
            'font.content.howToTitle': 'How to Use Pixel Font Generator',
            'font.content.step1':
                '<strong>Type:</strong> Enter your text in the input box. The preview will update instantly using the new Pixel32 font.',
            'font.content.step2':
                '<strong>Adjust:</strong> Use the "Font Size" slider to scale your text. Larger sizes are great for banners!',
            'font.content.step3':
                '<strong>Color:</strong> Choose a color that fits your design using the color picker.',
            'font.content.step4':
                '<strong>Export:</strong> Click "Save" to download your pixel text as a transparent PNG file.',
        },
        'zh-CN': {
            'meta.title': '像素画转换器 - 图片转像素画 | image2pixel',
            'meta.description':
                '使用 image2pixel 将照片一键转为像素画。强大的在线像素画转换工具，支持拼豆色板与图纸导出。',
            'meta.ogTitle': '像素画转换器 - image2pixel',
            'meta.ogDescription': '用简单好用的工具，把图片变成像素画。',
            'menu.title': '菜单',
            'nav.converter': '像素画转换',
            'nav.font': '像素字体',
            'nav.support': '支持',
            'hero.title': '图片转像素画',
            'hero.description': '在线像素画转换器，瞬间将照片转为像素风格图像。',
            'control.blockSize': '块大小：',
            'control.colorCount': '颜色数量：',
            'control.showGrid': '显示网格',
            'control.openImage': '打开图片',
            'preview.original': '原图',
            'preview.pixelArt': '像素画',
            'preview.placeholder': '点击 + 打开图片开始',
            'preview.blueprint': '拼豆图纸',
            'preview.oneToOne': '1:1',
            'preview.oneToOneHint': '保存时每个色块对应 1 个像素',
            'title.menu': '菜单',
            'title.open': '打开',
            'title.palette': '色板',
            'title.save': '保存',
            'title.print': '打印',
            'content.howToTitle': '如何使用像素画转换器',
            'content.step1':
                '<strong>上传：</strong>在「原图」区域点击「打开」按钮选择图片，支持 JPG、PNG、WebP。',
            'content.step2':
                '<strong>调整：</strong>用「块大小」滑块控制像素密度，数值越大画面越抽象、越复古。',
            'content.step3':
                '<strong>色板：</strong>从 GameBoy、NES 等数十种内置色板中选择，获得原汁原味的复古风格。',
            'content.step4':
                '<strong>导出：</strong>满意后点击像素画区域的「保存」，下载 PNG 成品。',
            'content.whyTitle': '为什么选择我们的像素画工具？',
            'content.whyBody':
                '在线 <strong>像素画转换器</strong> 采用先进量化算法，将任意照片转为精美像素图。适合制作 <strong>拼豆图纸</strong>、8-bit 游戏素材或独特数字艺术。无论你是需要占位素材的游戏开发者，还是设计 <strong>拼豆模板</strong> 的 DIY 爱好者，image2pixel 都能满足需求。',
            'faq.title': '常见问题',
            'faq.q1': '这个工具免费吗？',
            'faq.a1':
                '是的！image2pixel 对所有人免费开放。我们也提供 Steam 桌面版，适合需要批量处理等高级功能的用户。',
            'faq.q2': '如何获得最佳效果？',
            'faq.a2': '建议使用主体清晰、对比度高的图片。细节过多或噪点过多的图片像素化后可能显得杂乱。',
            'faq.q3': '色板选项有什么用？',
            'faq.a3':
                '色板会限制转换使用的颜色集合，让画面更像 Atari 2600、初代 GameBoy 等经典硬件上的风格。',
            'faq.q4': '支持哪些拼豆品牌色板？',
            'faq.a4':
                '内置 7 种热门品牌拼豆色板：<strong>Perler</strong>、<strong>Perler Mini</strong>、<strong>Hama Midi</strong>、<strong>Hama Mini</strong>、<strong>Nabbi</strong>、<strong>Artkal S (5mm)</strong>、<strong>Artkal C (2.6mm)</strong>。在结果面板点击色板按钮，在列表中选择即可。',
            'faq.q5': '如何导出拼豆图纸？',
            'faq.a5':
                '上传图片并选择拼豆色板（如 Perler 或 Hama）后，结果面板会出现 <strong>拼豆图纸</strong> 复选框。勾选后点击 <strong>保存</strong>，下载的 PNG 为带官方色号编号的网格图，便于按图拼豆。',
            'faq.q6': '如何保存真正的 1:1 像素画？',
            'faq.a6':
                '在结果面板勾选 <strong>1:1</strong>，再点击 <strong>保存</strong>。下载的 PNG 中每个色块只占 1 个物理像素，适合游戏精灵、二次放大或导入其它像素工具。屏幕预览仍保持大尺寸，便于查看。',
            'footer.steam': 'Steam',
            'footer.chromeExtension': 'Chrome 扩展',
            'footer.help': '帮助',
            'footer.copyright': '保留所有权利。',
            'footer.iosTerms': 'iOS 条款',
            'footer.androidTerms': 'Android 条款',
            'footer.privacy': '隐私政策',
            'footer.chromePrivacy': 'Chrome 扩展隐私政策',
            'footer.support': '支持',
            'modal.choosePalette': '选择色板',
            'modal.auto': '自动（无色板）',
            'modal.upload': '上传自定义色板',
            'modal.hint': '支持：.gpl (GIMP)、.json、.hex、.txt',
            'loading.processing': '处理中…',
            'palette.label': '色板：{name}',
            'palette.customSection': '自定义色板',
            'palette.builtinSection': '内置色板',
            'palette.deleteTitle': '删除自定义色板',
            'palette.deleteConfirm': '删除自定义色板「{id}」？',
            'palette.overwriteConfirm': '色板「{id}」已存在，是否覆盖？',
            'palette.parseError': '无法解析色板文件：{message}',
            'palette.fuseBeadDesc': '拼豆色板',
            'bead.patternFailed': '生成拼豆图纸失败',
            'bead.patternTitle': '{brand} 拼豆图纸',
            'font.meta.title': '像素字体生成器 - 像素艺术文字 | image2pixel',
            'font.meta.description': '用 image2pixel 像素字体生成器，轻松制作复古 8-bit 风格文字。',
            'font.hero.title': '像素字体生成器',
            'font.hero.description': '输入文字，即时生成精美像素艺术字体效果。',
            'font.placeholder': '在此输入文字…',
            'font.control.size': '字号：',
            'font.control.color': '文字颜色：',
            'font.preview.title': '文字预览',
            'font.content.howToTitle': '如何使用像素字体生成器',
            'font.content.step1':
                '<strong>输入：</strong>在输入框中键入文字，预览将使用 Pixel32 字体即时更新。',
            'font.content.step2':
                '<strong>调整：</strong>用「字号」滑块缩放文字，较大字号适合做横幅。',
            'font.content.step3': '<strong>颜色：</strong>用取色器选择与设计搭配的颜色。',
            'font.content.step4': '<strong>导出：</strong>点击「保存」下载透明背景 PNG 像素文字。',
        },
        'zh-TW': {
            'meta.title': '像素畫轉換器 - 圖片轉像素畫 | image2pixel',
            'meta.description':
                '使用 image2pixel 將照片一鍵轉為像素畫。強大的線上像素畫轉換工具，支援拼豆色盤與圖紙匯出。',
            'meta.ogTitle': '像素畫轉換器 - image2pixel',
            'meta.ogDescription': '用簡單好用的工具，把圖片變成像素畫。',
            'menu.title': '選單',
            'nav.converter': '像素畫轉換',
            'nav.font': '像素字型',
            'nav.support': '支援',
            'hero.title': '圖片轉像素畫',
            'hero.description': '線上像素畫轉換器，瞬間將照片轉為像素風格圖像。',
            'control.blockSize': '區塊大小：',
            'control.colorCount': '顏色數量：',
            'control.showGrid': '顯示格線',
            'control.openImage': '開啟圖片',
            'preview.original': '原圖',
            'preview.pixelArt': '像素畫',
            'preview.placeholder': '點擊 + 開啟圖片開始',
            'preview.blueprint': '拼豆圖紙',
            'preview.oneToOne': '1:1',
            'preview.oneToOneHint': '儲存時每個色塊對應 1 個像素',
            'title.menu': '選單',
            'title.open': '開啟',
            'title.palette': '色盤',
            'title.save': '儲存',
            'title.print': '列印',
            'content.howToTitle': '如何使用像素畫轉換器',
            'content.step1':
                '<strong>上傳：</strong>在「原圖」區域點擊「開啟」按鈕選擇圖片，支援 JPG、PNG、WebP。',
            'content.step2':
                '<strong>調整：</strong>用「區塊大小」滑桿控制像素密度，數值越大畫面越抽象、越復古。',
            'content.step3':
                '<strong>色盤：</strong>從 GameBoy、NES 等數十種內建色盤中選擇，獲得原汁原味的復古風格。',
            'content.step4':
                '<strong>匯出：</strong>滿意後點擊像素畫區域的「儲存」，下載 PNG 成品。',
            'content.whyTitle': '為什麼選擇我們的像素畫工具？',
            'content.whyBody':
                '線上 <strong>像素畫轉換器</strong> 採用先進量化演算法，將任意照片轉為精美像素圖。適合製作 <strong>拼豆圖紙</strong>、8-bit 遊戲素材或獨特數位藝術。無論你是需要占位素材的遊戲開發者，還是設計 <strong>拼豆模板</strong> 的 DIY 愛好者，image2pixel 都能滿足需求。',
            'faq.title': '常見問題',
            'faq.q1': '這個工具免費嗎？',
            'faq.a1':
                '是的！image2pixel 對所有人免費開放。我們也提供 Steam 桌面版，適合需要批次處理等進階功能的使用者。',
            'faq.q2': '如何獲得最佳效果？',
            'faq.a2': '建議使用主體清晰、對比度高的圖片。細節過多或雜訊過多的圖片像素化後可能顯得雜亂。',
            'faq.q3': '色盤選項有什麼用？',
            'faq.a3':
                '色盤會限制轉換使用的顏色集合，讓畫面更像 Atari 2600、初代 GameBoy 等經典硬體上的風格。',
            'faq.q4': '支援哪些拼豆品牌色盤？',
            'faq.a4':
                '內建 7 種熱門品牌拼豆色盤：<strong>Perler</strong>、<strong>Perler Mini</strong>、<strong>Hama Midi</strong>、<strong>Hama Mini</strong>、<strong>Nabbi</strong>、<strong>Artkal S (5mm)</strong>、<strong>Artkal C (2.6mm)</strong>。在結果面板點擊色盤按鈕，在清單中選擇即可。',
            'faq.q5': '如何匯出拼豆圖紙？',
            'faq.a5':
                '上傳圖片並選擇拼豆色盤（如 Perler 或 Hama）後，結果面板會出現 <strong>拼豆圖紙</strong> 核取方塊。勾選後點擊 <strong>儲存</strong>，下載的 PNG 為帶官方色號編號的格線圖，便於按圖拼豆。',
            'faq.q6': '如何儲存真正的 1:1 像素畫？',
            'faq.a6':
                '在結果面板勾選 <strong>1:1</strong>，再點擊 <strong>儲存</strong>。下載的 PNG 中每個色塊只佔 1 個物理像素，適合遊戲精靈、二次放大或匯入其它像素工具。螢幕預覽仍保持大尺寸，便於查看。',
            'footer.steam': 'Steam',
            'footer.chromeExtension': 'Chrome 擴充功能',
            'footer.help': '說明',
            'footer.copyright': '保留所有權利。',
            'footer.iosTerms': 'iOS 條款',
            'footer.androidTerms': 'Android 條款',
            'footer.privacy': '隱私權政策',
            'footer.chromePrivacy': 'Chrome 擴充功能隱私權政策',
            'footer.support': '支援',
            'modal.choosePalette': '選擇色盤',
            'modal.auto': '自動（無色盤）',
            'modal.upload': '上傳自訂色盤',
            'modal.hint': '支援：.gpl (GIMP)、.json、.hex、.txt',
            'loading.processing': '處理中…',
            'palette.label': '色盤：{name}',
            'palette.customSection': '自訂色盤',
            'palette.builtinSection': '內建色盤',
            'palette.deleteTitle': '刪除自訂色盤',
            'palette.deleteConfirm': '刪除自訂色盤「{id}」？',
            'palette.overwriteConfirm': '色盤「{id}」已存在，是否覆蓋？',
            'palette.parseError': '無法解析色盤檔案：{message}',
            'palette.fuseBeadDesc': '拼豆色盤',
            'bead.patternFailed': '產生拼豆圖紙失敗',
            'bead.patternTitle': '{brand} 拼豆圖紙',
            'font.meta.title': '像素字型產生器 - 像素藝術文字 | image2pixel',
            'font.meta.description': '用 image2pixel 像素字型產生器，輕鬆製作復古 8-bit 風格文字。',
            'font.hero.title': '像素字型產生器',
            'font.hero.description': '輸入文字，即時產生精美像素藝術字型效果。',
            'font.placeholder': '在此輸入文字…',
            'font.control.size': '字型大小：',
            'font.control.color': '文字顏色：',
            'font.preview.title': '文字預覽',
            'font.content.howToTitle': '如何使用像素字型產生器',
            'font.content.step1':
                '<strong>輸入：</strong>在輸入框中鍵入文字，預覽將使用 Pixel32 字型即時更新。',
            'font.content.step2':
                '<strong>調整：</strong>用「字型大小」滑桿縮放文字，較大字型適合做橫幅。',
            'font.content.step3': '<strong>顏色：</strong>用取色器選擇與設計搭配的顏色。',
            'font.content.step4': '<strong>匯出：</strong>點擊「儲存」下載透明背景 PNG 像素文字。',
        },
    };

    let currentLocale = 'en';

    function normalizeLocale(lang) {
        if (!lang) return 'en';
        const l = String(lang).toLowerCase().replace(/_/g, '-');
        if (!l.startsWith('zh')) return 'en';
        if (
            l.includes('tw') ||
            l.includes('hk') ||
            l.includes('mo') ||
            l.includes('hant') ||
            l === 'zh-hk' ||
            l === 'zh-mo'
        ) {
            return 'zh-TW';
        }
        return 'zh-CN';
    }

    function getInitialLocale() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && SUPPORTED.includes(stored)) return stored;
        } catch (_) {
            /* ignore */
        }
        const nav = navigator.language || navigator.userLanguage || 'en';
        return normalizeLocale(nav);
    }

    function format(str, params) {
        if (!params) return str;
        return str.replace(/\{(\w+)\}/g, (_, key) =>
            params[key] !== undefined ? String(params[key]) : `{${key}}`
        );
    }

    function t(key, params) {
        const dict = messages[currentLocale] || messages.en;
        const fallback = messages.en[key];
        const raw = dict[key] ?? fallback ?? key;
        return format(raw, params);
    }

    function htmlLangAttr(locale) {
        if (locale === 'zh-CN') return 'zh-Hans';
        if (locale === 'zh-TW') return 'zh-Hant';
        return 'en';
    }

    function legalHref(filename) {
        if (currentLocale === 'zh-CN') return `zh-CN/${filename}`;
        if (currentLocale === 'zh-TW') return `zh-TW/${filename}`;
        return filename;
    }

    function isFontPage() {
        return /pixel-text-generator\.html$/i.test(window.location.pathname);
    }

    function applyMeta() {
        const font = isFontPage();
        const titleKey = font ? 'font.meta.title' : 'meta.title';
        const descKey = font ? 'font.meta.description' : 'meta.description';
        document.title = t(titleKey);
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', t(descKey));
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', t(font ? 'font.meta.title' : 'meta.ogTitle'));
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', t(font ? 'font.meta.description' : 'meta.ogDescription'));
        const twTitle = document.querySelector('meta[property="twitter:title"]');
        if (twTitle) twTitle.setAttribute('content', t(font ? 'font.meta.title' : 'meta.ogTitle'));
        const twDesc = document.querySelector('meta[property="twitter:description"]');
        if (twDesc) twDesc.setAttribute('content', t(font ? 'font.meta.description' : 'meta.ogDescription'));
    }

    function applyElements() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });
        document.querySelectorAll('[data-i18n-html]').forEach((el) => {
            const key = el.getAttribute('data-i18n-html');
            if (key) el.innerHTML = t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = t(key);
        });
        document.querySelectorAll('[data-i18n-title]').forEach((el) => {
            const key = el.getAttribute('data-i18n-title');
            if (key) el.title = t(key);
        });
        document.querySelectorAll('[data-i18n-href]').forEach((el) => {
            const spec = el.getAttribute('data-i18n-href');
            if (!spec) return;
            const [attr, file] = spec.split(':');
            const href = legalHref(file);
            if (attr === 'href') el.href = href;
        });
    }

    function updateLanguageSelector() {
        const root = document.getElementById('languageSelector');
        if (!root) return;
        root.querySelectorAll('[data-locale]').forEach((link) => {
            const loc = link.getAttribute('data-locale');
            link.classList.toggle('active', loc === currentLocale);
            link.setAttribute('aria-current', loc === currentLocale ? 'true' : 'false');
        });
    }

    function bindLanguageSelector() {
        const root = document.getElementById('languageSelector');
        if (!root || root.dataset.bound === '1') return;
        root.dataset.bound = '1';
        root.addEventListener('click', (e) => {
            const link = e.target.closest('[data-locale]');
            if (!link) return;
            e.preventDefault();
            setLocale(link.getAttribute('data-locale'));
        });
    }

    function setLocale(locale) {
        if (!SUPPORTED.includes(locale)) return;
        currentLocale = locale;
        try {
            localStorage.setItem(STORAGE_KEY, locale);
        } catch (_) {
            /* ignore */
        }
        document.documentElement.lang = htmlLangAttr(locale);
        applyMeta();
        applyElements();
        updateLanguageSelector();
        window.dispatchEvent(
            new CustomEvent('image2pixel:localechange', { detail: { locale } })
        );
    }

    function init() {
        currentLocale = getInitialLocale();
        document.documentElement.lang = htmlLangAttr(currentLocale);
        bindLanguageSelector();
        applyMeta();
        applyElements();
        updateLanguageSelector();
    }

    window.image2pixelI18n = {
        t,
        setLocale,
        getLocale: () => currentLocale,
        legalHref,
        SUPPORTED,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
