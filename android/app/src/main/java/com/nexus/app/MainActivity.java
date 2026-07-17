package com.nexus.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebView webView = this.getBridge().getWebView();
    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setGeolocationEnabled(true);
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        String host = uri.getHost();
        if (host != null && (host.equals("192.168.18.14") || host.equals("localhost") || host.equals("127.0.0.1") || host.endsWith(".loca.lt") || host.endsWith("trycloudflare.com") || host.contains("broker.hivemq.com"))) {
          view.loadUrl(uri.toString());
          return true;
        }
        return super.shouldOverrideUrlLoading(view, request);
      }
    });
  }
}
