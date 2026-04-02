package com.nanamoureux.widget

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class SettingsActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_settings)

    val appUrl = findViewById<EditText>(R.id.appUrl)
    val apiUrl = findViewById<EditText>(R.id.apiUrl)
    val token = findViewById<EditText>(R.id.token)
    val recipient = findViewById<EditText>(R.id.recipient)

    val currentAppUrl = Prefs.getAppUrl(this).ifBlank { BuildConfig.DEFAULT_APP_URL }
    appUrl.setText(currentAppUrl)
    apiUrl.setText(Prefs.getApiUrl(this).ifBlank { BuildConfig.DEFAULT_APP_URL })
    token.setText(Prefs.getToken(this))
    recipient.setText(Prefs.getRecipient(this))

    findViewById<Button>(R.id.saveBtn).setOnClickListener {
      val rawApiUrl = apiUrl.text?.toString().orEmpty()
      val rawAppUrl = appUrl.text?.toString().orEmpty()
      val normalizedApi = WidgetUrls.normalizeBaseUrl(rawApiUrl)
      val normalizedApp = WidgetUrls.normalizeBaseUrl(rawAppUrl)

      Prefs.setAll(
        this,
        normalizedApi,
        token.text?.toString().orEmpty(),
        recipient.text?.toString().orEmpty(),
        normalizedApp,
      )
      val msg =
        if (normalizedApi != rawApiUrl.trim() || normalizedApp != rawAppUrl.trim()) "Enregistré (URL corrigée)"
        else "Enregistré"
      Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
      PoetryWidgetProvider.requestUpdateNow(this)
      finish()
    }
  }
}
