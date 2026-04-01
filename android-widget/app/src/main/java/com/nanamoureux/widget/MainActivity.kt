package com.nanamoureux.widget

import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    val apiUrl = findViewById<EditText>(R.id.apiUrl)
    val token = findViewById<EditText>(R.id.token)
    val recipient = findViewById<EditText>(R.id.recipient)
    val appUrl = findViewById<EditText>(R.id.appUrl)

    apiUrl.setText(Prefs.getApiUrl(this))
    token.setText(Prefs.getToken(this))
    recipient.setText(Prefs.getRecipient(this))
    appUrl.setText(Prefs.getAppUrl(this))

    findViewById<Button>(R.id.saveBtn).setOnClickListener {
      Prefs.setAll(
        this,
        apiUrl.text?.toString().orEmpty(),
        token.text?.toString().orEmpty(),
        recipient.text?.toString().orEmpty(),
        appUrl.text?.toString().orEmpty(),
      )
      Toast.makeText(this, "Enregistré. Le widget se mettra à jour.", Toast.LENGTH_SHORT).show()
      PoetryWidgetProvider.requestUpdateNow(this)
    }

    findViewById<Button>(R.id.openAppBtn).setOnClickListener {
      val url = Prefs.getAppUrl(this)
      if (url.isBlank()) {
        Toast.makeText(this, "Renseigne l’URL de l’app (ex: https://...)", Toast.LENGTH_SHORT).show()
        return@setOnClickListener
      }
      startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url)))
    }
  }
}

