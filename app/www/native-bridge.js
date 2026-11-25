/* Kentsel Dönüşüm — uygulama köprüsü
 * Oyunun test reklamlarını ve test satın almalarını gerçek AdMob + Google Play Billing ile değiştirir.
 * Sadece telefonda (Capacitor içinde) çalışır; tarayıcıda hiçbir şey yapmaz.
 *
 * YAYINDAN ÖNCE: TEST_MODE = false yap ve aşağıdaki ID'leri kendi AdMob ID'lerinle değiştir.
 */
(function () {
  const TEST_MODE = true;

  const AD_IDS = {
    // Google'ın resmi test ID'leri (TEST_MODE = true iken kullanılır)
    testRewarded: 'ca-app-pub-3940256099942544/5224354917',
    testInterstitial: 'ca-app-pub-3940256099942544/1033173712',
    // AdMob panelinde açtığın reklam birimlerinin ID'leri
    rewarded: 'ca-app-pub-4861191491090667/9926409052',
    interstitial: 'ca-app-pub-4861191491090667/4243284640'
  };
  const INTERSTITIAL_EVERY = 3; // kaç bölümde bir geçiş reklamı

  // Play Console > Uygulama içi ürünler'de bu ID'lerle ürün açılacak
  const PRODUCT_IDS = { p1: 'kd_coins_500', p2: 'kd_coins_1500', p3: 'kd_coins_5000', noads: 'kd_noads' };

  const Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;
  window.KD_RELEASE = true;
  const P = Cap.Plugins || {};

  const banner = (a, b, c) => { try { showBanner(a, b, c || '#5c677d', 1.8); } catch (e) {} };
  const duckSafe = on => { try { duck(on); } catch (e) {} };

  /* ---------- Geri tuşu ---------- */
  if (P.App) {
    P.App.addListener('backButton', () => {
      try {
        if (typeof modal !== 'undefined' && modal) { modal = null; return; }
        if (scene === 'play') { paused = !paused; return; }
        if (scene === 'cities') { mapBack(); return; }
        if (scene === 'hood') { goCities(); return; }
        if (scene === 'over' || scene === 'win' || scene === 'shop' || scene === 'album') { goHome(); return; }
        if (scene === 'home') P.App.exitApp();
      } catch (e) {}
    });
    // uygulama arka plana gidince oyunu duraklat
    P.App.addListener('pause', () => { try { if (scene === 'play') paused = true; } catch (e) {} });
  }
  if (P.StatusBar) { P.StatusBar.hide().catch(() => {}); }
  if (P.SplashScreen) { setTimeout(() => P.SplashScreen.hide().catch(() => {}), 600); }

  /* ---------- Reklamlar (AdMob) ---------- */
  const AdMob = P.AdMob;
  if (AdMob) {
    const rewardedId = TEST_MODE ? AD_IDS.testRewarded : AD_IDS.rewarded;
    const interId = TEST_MODE ? AD_IDS.testInterstitial : AD_IDS.interstitial;
    let ready = false;

    (async () => {
      try {
        await AdMob.initialize({ initializeForTesting: TEST_MODE });
        // Avrupa (GDPR) için reklam izni formu
        try {
          const info = await AdMob.requestConsentInfo();
          if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
          // Oyuncu izni sonradan değiştirebilsin (Ayarlar'daki "Reklam izni" butonu)
          const again = await AdMob.requestConsentInfo().catch(() => info);
          const need = again.privacyOptionsRequirementStatus === 'REQUIRED' || (again.isConsentFormAvailable && again.status !== 'NOT_REQUIRED');
          if (need) window.KD_privacy = { open: () => (AdMob.showPrivacyOptionsForm ? AdMob.showPrivacyOptionsForm() : AdMob.showConsentForm()).catch(() => {}) };
        } catch (e) {}
        ready = true;
      } catch (e) { console.log('AdMob init hatası', e); }
    })();

    // Oyundaki "reklam izle" butonları bu fonksiyonu çağırır
    window.showAd = function (label, reward) {
      if (!ready) { banner('Reklam hazır değil', 'Birkaç saniye sonra tekrar dene'); return; }
      duckSafe(true);
      let rewarded = false;
      const sub = AdMob.addListener('onRewardedVideoAdReward', () => { rewarded = true; });
      AdMob.prepareRewardVideoAd({ adId: rewardedId })
        .then(() => AdMob.showRewardVideoAd())
        .then(item => {
          duckSafe(false);
          if (rewarded || item) { try { sGold(); } catch (e) {} reward && reward(); }
        })
        .catch(() => { duckSafe(false); banner('Reklam yüklenemedi', 'İnternetini kontrol edip tekrar dene'); })
        .finally(() => { try { sub.then ? sub.then(s => s.remove()) : sub.remove(); } catch (e) {} });
    };

    // Bölüm sonlarında, reklamsız paket alınmadıysa, birkaç bölümde bir geçiş reklamı
    let ends = 0;
    window.KD_hooks = window.KD_hooks || {};
    window.KD_hooks.levelEnd = function () {
      try { if (noAds) return; } catch (e) {}
      ends++;
      if (!ready || ends % INTERSTITIAL_EVERY !== 0) return;
      AdMob.prepareInterstitial({ adId: interId }).then(() => AdMob.showInterstitial()).catch(() => {});
    };
  }

  /* ---------- Satın almalar (Google Play Billing) ---------- */
  document.addEventListener('deviceready', async () => {
    const C = window.CdvPurchase;
    if (!C) return;
    const { store: S, ProductType, Platform } = C;
    const byId = {};
    Object.keys(PRODUCT_IDS).forEach(k => { byId[PRODUCT_IDS[k]] = k; });

    S.register([
      { id: PRODUCT_IDS.p1, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
      { id: PRODUCT_IDS.p2, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
      { id: PRODUCT_IDS.p3, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY },
      { id: PRODUCT_IDS.noads, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY }
    ]);

    function grant(productId) {
      const k = byId[productId];
      if (!k) return;
      if (k === 'noads') { noAds = true; store.set('kd_noads', true); banner('Reklamlar kalktı!', 'Desteğin için teşekkürler 🙏', '#2a9d8f'); }
      else { const pk = PACKS.find(p => p.k === k); if (pk) { addCoins(pk.amt); banner('+' + pk.amt + ' para!', 'Desteğin için teşekkürler 🙏', '#2a9d8f'); } }
      try { sGold(); } catch (e) {}
    }

    S.when()
      .approved(t => t.finish())
      .finished(t => t.products.forEach(p => grant(p.id)));
    // Reklamsız paketi daha önce aldıysa (yeniden kurulum) geri yükle
    S.when().productUpdated(p => {
      if (p.id === PRODUCT_IDS.noads && p.owned) { noAds = true; store.set('kd_noads', true); }
      const k = byId[p.id], pk = PACKS.find(x => x.k === k);
      if (pk && p.pricing && p.pricing.price) pk.price = p.pricing.price; // fiyatı Play'den al
    });

    try { await S.initialize([Platform.GOOGLE_PLAY]); } catch (e) { console.log('Billing init hatası', e); }

    // Oyundaki fiyat butonları bu fonksiyonu çağırır
    window.iapTap = function (pk) {
      const p = S.get(PRODUCT_IDS[pk.k], Platform.GOOGLE_PLAY);
      const offer = p && p.getOffer();
      if (!offer) { banner('Mağaza hazır değil', 'İnternetini kontrol edip tekrar dene'); return; }
      offer.order().then(err => { if (err && err.code !== C.ErrorCode.PAYMENT_CANCELLED) banner('Satın alma olmadı', err.message || ''); });
    };
  }, false);
})();
