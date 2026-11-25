package com.cetin.kentseldonusum;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        allowAudio();
    }

    @Override
    public void onResume() {
        super.onResume();
        allowAudio();
    }

    // Oyunun sesi dokunmayı beklemeden çalabilsin (WebView varsayılanı engelliyor)
    private void allowAudio() {
        try {
            WebView wv = getBridge().getWebView();
            wv.getSettings().setMediaPlaybackRequiresUserGesture(false);
        } catch (Exception ignored) {}
    }
}
