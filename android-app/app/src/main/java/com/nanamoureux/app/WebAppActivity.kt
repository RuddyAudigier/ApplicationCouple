package com.nanamoureux.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class WebAppActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_webapp)

    val webView = findViewById<WebView>(R.id.webView)
    val settingsBtn = findViewById<ImageButton>(R.id.settingsBtn)

    settingsBtn.setOnClickListener {
      startActivity(Intent(this, SettingsActivity::class.java))
    }

    webView.settings.javaScriptEnabled = true
    webView.settings.domStorageEnabled = true
    webView.settings.mediaPlaybackRequiresUserGesture = true
    webView.webChromeClient = WebChromeClient()

    webView.webViewClient = object : WebViewClient() {
      override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val url = request.url.toString()
        // Ouvre les liens externes hors WebView
        if (!url.startsWith(getBaseUrl())) {
          startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
          return true
        }
        return false
      }
    }

    val base = getBaseUrl()
    val initial = resolveInitialUrl(base)
    webView.loadUrl(initial)
  }

  private fun getBaseUrl(): String {
    val stored = Prefs.getAppUrl(this).ifBlank { BuildConfig.DEFAULT_APP_URL }.trim()
    return stored.removeSuffix("/")
  }

  private fun resolveInitialUrl(base: String): String {
    val extra = intent?.getStringExtra(EXTRA_URL)?.trim().orEmpty()
    if (extra.isNotBlank()) return extra
    val data = intent?.data?.toString()?.trim().orEmpty()
    if (data.isNotBlank()) return data
    return base
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    val webView = findViewById<WebView>(R.id.webView)
    val base = getBaseUrl()
    webView.loadUrl(resolveInitialUrl(base))
  }

  companion object {
    const val EXTRA_URL = "extra_url"
  }
}
