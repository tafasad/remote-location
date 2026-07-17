package com.nexus.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;

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
        if (host != null && (host.equals("localhost") || host.equals("127.0.0.1") || host.endsWith(".loca.lt") || host.endsWith("trycloudflare.com") || host.contains("broker.hivemq.com"))) {
          view.loadUrl(uri.toString());
          return true;
        }
        return super.shouldOverrideUrlLoading(view, request);
      }
    });

    webView.addJavascriptInterface(new Object() {
      @JavascriptInterface
      public void installApk(String url) {
        try {
          File file = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "nexus.apk");
          if (!file.exists()) {
            android.widget.Toast.makeText(MainActivity.this, "APK nao encontrado. Baixe primeiro.", android.widget.Toast.LENGTH_LONG).show();
            return;
          }
          Uri apkUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", file);
          Intent intent = new Intent(Intent.ACTION_VIEW);
          intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
          intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
          intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
          startActivity(intent);
        } catch (Exception e) {
          android.widget.Toast.makeText(MainActivity.this, "Erro: " + e.getMessage(), android.widget.Toast.LENGTH_LONG).show();
        }
      }

      @JavascriptInterface
      public void downloadApk(String url) {
        try {
          android.app.DownloadManager dm = (android.app.DownloadManager) getSystemService(android.content.Context.DOWNLOAD_SERVICE);
          Uri uri = Uri.parse(url);
          android.app.DownloadManager.Request req = new android.app.DownloadManager.Request(uri);
          req.setTitle("Nexus Update");
          req.setDescription("Baixando atualizacao...");
          req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "nexus.apk");
          req.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
          req.setMimeType("application/vnd.android.package-archive");
          dm.enqueue(req);
          android.widget.Toast.makeText(MainActivity.this, "Download iniciado", android.widget.Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
          android.widget.Toast.makeText(MainActivity.this, "Erro download: " + e.getMessage(), android.widget.Toast.LENGTH_LONG).show();
        }
      }
    }, "NexusApp");
  }
}
