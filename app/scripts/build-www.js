// Oyunun web sürümünden (../index.html) uygulama sürümünü (www/index.html) üretir.
// Kullanım (app klasöründe):  node scripts/build-www.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', '..', 'index.html');
const out = path.join(__dirname, '..', 'www', 'index.html');
let html = fs.readFileSync(src, 'utf8');
// Google Fonts yerine uygulamanın içindeki fontlar (internetsiz çalışsın)
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="fonts/fonts.css" rel="stylesheet">');
// Mağaza modu bayrağı + köprü scriptleri
html = html.replace('<script>', '<script>window.KD_RELEASE=true;</script>\n<script>');
html = html.replace(/<\/body>/i, '<script src="cordova.js"></script>\n<script src="native-bridge.js"></script>\n</body>');
fs.writeFileSync(out, html);
console.log('www/index.html hazır (' + Math.round(html.length / 1024) + ' KB)');
