package com.nanamoureux.app

import android.content.Context

object Prefs {
  private const val NAME = "nanamoureux_prefs"

  private const val KEY_API_URL = "api_url"
  private const val KEY_TOKEN = "token"
  private const val KEY_RECIPIENT = "recipient"
  private const val KEY_APP_URL = "app_url"
  private const val KEY_LAST_WIDGET_CONTENT = "last_widget_content"
  private const val KEY_LAST_WIDGET_META = "last_widget_meta"

  fun getApiUrl(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString(KEY_API_URL, "")?.trim().orEmpty()

  fun getToken(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString(KEY_TOKEN, "")?.trim().orEmpty()

  fun getRecipient(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString(KEY_RECIPIENT, "")?.trim().orEmpty()

  fun getAppUrl(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString(KEY_APP_URL, "")?.trim().orEmpty()

  fun setAll(ctx: Context, apiUrl: String, token: String, recipient: String, appUrl: String) {
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).edit()
      .putString(KEY_API_URL, apiUrl.trim())
      .putString(KEY_TOKEN, token.trim())
      .putString(KEY_RECIPIENT, recipient.trim().lowercase())
      .putString(KEY_APP_URL, appUrl.trim())
      .apply()
  }

  fun getLastWidgetContent(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString(KEY_LAST_WIDGET_CONTENT, "") ?: ""

  fun getLastWidgetMeta(ctx: Context): String =
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString(KEY_LAST_WIDGET_META, "") ?: ""

  fun setLastWidgetState(ctx: Context, content: String, meta: String) {
    ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE).edit()
      .putString(KEY_LAST_WIDGET_CONTENT, content)
      .putString(KEY_LAST_WIDGET_META, meta)
      .apply()
  }
}
