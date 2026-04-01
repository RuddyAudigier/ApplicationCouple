package com.nanamoureux.widget

import android.content.Context
import android.webkit.JavascriptInterface

class NanamoureuxBridge(private val context: Context) {
  @JavascriptInterface
  fun setUserEmail(email: String?) {
    val next = (email ?: "").trim().lowercase()
    if (next.isBlank()) return
    // Le widget doit afficher les mots destinés au propriétaire du téléphone.
    // On ne force pas si l’utilisateur a déjà configuré un autre email.
    val current = Prefs.getRecipient(context).trim().lowercase()
    if (current.isBlank()) {
      Prefs.setRecipient(context, next)
    }
  }
}

