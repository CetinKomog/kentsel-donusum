# Kentsel Dönüşüm → Google Play: Kurulum Rehberi

Bu rehberdeki komutları kendin yazmana gerek yok. PC'de Claude Code'u bu klasörde açıp
**"KURULUM.md'yi oku ve 2. adımdan başlayarak sırayla uygula"** demen yeterli.
Senin yapacağın kısımlar 🙋 ile işaretli.

---

## 0. Bilgisayarda olması gerekenler (bir kere)
- **Node.js** (LTS sürümü) → nodejs.org
- **Android Studio** → developer.android.com/studio (kurulumda "Android SDK" seçili kalsın)
- **Git** (GitHub'a yüklemek için)

## 1. 🙋 Hesaplar (paralel başlat, onay birkaç gün sürebilir)
1. **Google Play Console**: play.google.com/console → kişisel hesap, 25$ tek seferlik, kimlik doğrulama.
2. **AdMob**: admob.google.com → Uygulama ekle → "Android", "Henüz yayınlanmadı".
   - İki reklam birimi aç: **Ödüllü (Rewarded)** ve **Geçiş (Interstitial)**.
   - Şu 3 ID'yi bir yere not et:
     - Uygulama ID'si: `ca-app-pub-XXXX~YYYY`
     - Ödüllü birim ID'si: `ca-app-pub-XXXX/AAAA`
     - Geçiş birim ID'si: `ca-app-pub-XXXX/BBBB`

## 2. Projeyi kur (Claude Code yapar)
```bash
cd app
npm install
node scripts/build-www.js        # oyunun güncel halini www/ içine kopyalar
npx cap add android              # android/ klasörünü oluşturur
npm run assets                   # ikon + açılış ekranını üretir (assets/ klasöründen)
npx cap sync android
```

## 3. AdMob uygulama ID'sini Android'e ekle (Claude Code yapar)
`app/android/app/src/main/AndroidManifest.xml` içinde `<application ...>` etiketinin içine:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-4861191491090667~9687183010"/>
```
> Bu senin gerçek AdMob uygulama ID'n. Test sırasında da bu kalabilir; test reklamlarını `native-bridge.js` içindeki `TEST_MODE = true` sağlıyor.

## 4. Telefonda dene
1. 🙋 Telefonda: Ayarlar → Telefon hakkında → MIUI sürümüne 7 kere dokun → Geliştirici seçenekleri → **USB hata ayıklama** aç.
2. Telefonu USB ile bağla, sonra:
```bash
npx cap run android
```
   (veya `npm run open` ile Android Studio'yu açıp ▶ Run.)
3. Kontrol listesi:
   - Oyun açılıyor, fontlar düzgün, ses var
   - Dükkân → Para → "İZLE" → **Test Ad** yazan reklam çıkıyor ve +20 para geliyor
   - 3 bölümde bir geçiş reklamı (test) çıkıyor
   - Telefonun geri tuşu menülerde geri gidiyor, oyunda duraklatıyor

## 5. 🙋 Satın alma ürünleri (Play Console)
Uygulamayı en az bir kere Play Console'a yükledikten sonra (7. adım, dahili test yeterli):
Play Console → Para kazan → Ürünler → **Uygulama içi ürünler** → şu ID'lerle 4 ürün oluştur:

| Ürün ID'si | Ad | Önerilen fiyat |
|---|---|---|
| `kd_coins_500` | Avuç Dolusu (500 para) | ₺29,99 |
| `kd_coins_1500` | Kese (1.500 para) | ₺69,99 |
| `kd_coins_5000` | Hazine Sandığı (5.000 para) | ₺179,99 |
| `kd_noads` | Reklamsız Oyun | ₺49,99 |

Fiyatları oyun otomatik olarak Play'den çeker, kodda değiştirmen gerekmez.

## 6. Yayın ayarları (Claude Code yapar, ID'leri sen verirsin)
1. `app/www/native-bridge.js` en üstte:
   - `TEST_MODE = false`
   - `rewarded` ve `interstitial` satırlarına kendi AdMob birim ID'lerin
2. `AndroidManifest.xml` içindeki test uygulama ID'sini kendi AdMob **uygulama** ID'nle değiştir.
3. `capacitor.config.json` → `appId` (şu an `com.cetin.kentseldonusum`). **Play'e ilk yüklemeden sonra bir daha değiştirilemez**, şimdi karar ver.
4. Oyunu güncellediysen önce: `node scripts/build-www.js && npx cap sync android`

## 7. İmzalı paket (AAB) ve yükleme
1. Android Studio → Build → **Generate Signed App Bundle** → yeni keystore oluştur.
   - 🙋 **Keystore dosyasını ve şifresini kaybetme!** Kaybedersen güncelleme yükleyemezsin. Bulut + USB'ye yedekle. GitHub'a KOYMA (.gitignore zaten engelliyor).
2. Çıkan `app-release.aab` dosyasını Play Console → Test → **Kapalı test** → Yeni sürüm → yükle.

## 8. 🙋 Mağaza sayfası
`store/` klasöründe hepsi hazır:
- `icon-512.png` → Uygulama simgesi
- `feature-1024x500.png` → Öne çıkan grafik
- `screenshots/01..08.png` → Telefon ekran görüntüleri
- `MAGAZA_METINLERI.md` → Ad, kısa ve uzun açıklama, içerik derecelendirme ve Data safety cevapları
- **Gizlilik politikası linki**: `privacy/index.html` sayfasını yayında bir adrese koy (aşağıya bak), linki Play Console → Uygulama içeriği → Gizlilik politikası alanına yapıştır. Sayfadaki **[E-POSTA]** kısmını kendi e-postanla değiştir.

## 9. 🙋 Kapalı test → yayın
- En az **12 test kullanıcısı**, **14 gün** kesintisiz (yeni kişisel hesap kuralı).
- Testçilere Play'deki test linkini gönder, oynasınlar.
- 14 gün dolunca Play Console → "Üretim erişimi için başvur" → onaylanınca yayın.

---

### Gizlilik politikasını nereye koyarım?
İki kolay yol:
1. **GitHub Pages**: Repo → Settings → Pages → Branch: `main`, klasör: `/ (root)` → Kaydet.
   Link: `https://KULLANICI_ADIN.github.io/REPO_ADI/privacy/` (repo herkese açık olmalı)
2. **Claude artifact**: Hazırladığım "Kentsel Dönüşüm — Gizlilik Politikası" sayfasını Claude'da **herkese açık paylaş** ve linkini kullan.

### Oyunu güncellemek
Web sürümü kök klasördeki `index.html`. Değişiklikten sonra:
```bash
cd app && node scripts/build-www.js && npx cap sync android
```
Sonra Android Studio'da `versionCode`u 1 artırıp yeni AAB oluştur.
