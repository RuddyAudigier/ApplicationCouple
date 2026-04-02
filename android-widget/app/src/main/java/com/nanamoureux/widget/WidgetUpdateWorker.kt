package com.nanamoureux.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class WidgetUpdateWorker(
  appContext: Context,
  params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

  override suspend fun doWork(): Result {
    val ids = inputData.getIntArray(KEY_WIDGET_IDS)
    val appWidgetIds = if (ids != null && ids.isNotEmpty()) ids else {
      val mgr = AppWidgetManager.getInstance(applicationContext)
      mgr.getAppWidgetIds(ComponentName(applicationContext, PoetryWidgetProvider::class.java))
    }

    val mgr = AppWidgetManager.getInstance(applicationContext)
    if (appWidgetIds.isEmpty()) return Result.success()

    val apiUrl = WidgetUrls.normalizeBaseUrl(Prefs.getApiUrl(applicationContext))
    val token = Prefs.getToken(applicationContext)
    val recipient = Prefs.getRecipient(applicationContext)

    if (apiUrl.isBlank() || token.isBlank() || recipient.isBlank()) {
      for (id in appWidgetIds) {
        val views = RemoteViews(applicationContext.packageName, R.layout.widget_poetry)
        views.setTextViewText(R.id.widgetTitle, "Nanamoureux")
        views.setTextViewText(R.id.widgetContent, "Ouvre l’app Nanamoureux pour configurer le widget.")
        PoetryWidgetProvider.buildOpenAppIntent(applicationContext)?.let { views.setOnClickPendingIntent(R.id.widgetRoot, it) }
        PoetryWidgetProvider.buildComposeWebIntent(applicationContext)?.let { views.setOnClickPendingIntent(R.id.widgetCompose, it) }
        mgr.updateAppWidget(id, views)
      }
      return Result.success()
    }

    val fullUrl = buildUrl(apiUrl, token, recipient)
    val (content, meta) = fetchLatest(fullUrl)

    for (id in appWidgetIds) {
      val views = RemoteViews(applicationContext.packageName, R.layout.widget_poetry)
      views.setTextViewText(R.id.widgetTitle, "Nanamoureux")
      views.setTextViewText(R.id.widgetContent, content.ifBlank { "Aucun mot pour le moment." })
      views.setTextViewText(R.id.widgetMeta, meta)
      PoetryWidgetProvider.buildOpenAppIntent(applicationContext)?.let { views.setOnClickPendingIntent(R.id.widgetRoot, it) }
      PoetryWidgetProvider.buildComposeWebIntent(applicationContext)?.let { views.setOnClickPendingIntent(R.id.widgetCompose, it) }
      mgr.updateAppWidget(id, views)
    }

    return Result.success()
  }

  private fun buildUrl(apiUrl: String, token: String, recipient: String): String {
    val base = WidgetUrls.normalizeBaseUrl(apiUrl)
    val url = "$base/api/poesie-widget?token=${encode(token)}&recipient=${encode(recipient)}&includeShared=1"
    return url
  }

  private fun encode(value: String): String =
    java.net.URLEncoder.encode(value, "UTF-8")

  private fun fetchLatest(urlStr: String): Pair<String, String> {
    val url = URL(urlStr)
    val conn = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"
      connectTimeout = 8000
      readTimeout = 8000
    }

    return try {
      val code = conn.responseCode
      val body = (if (code in 200..299) conn.inputStream else conn.errorStream).bufferedReader().use { it.readText() }
      if (code !in 200..299) {
        val msg = try {
          val json = JSONObject(body)
          json.optString("error", "").ifBlank { body }
        } catch (_: Exception) {
          body
        }
        val prefix = when (code) {
          401 -> "Token invalide"
          404 -> "URL API invalide"
          500 -> "Erreur configuration serveur"
          else -> "Erreur widget ($code)"
        }
        val short = msg.trim().take(120)
        Log.w("WidgetUpdateWorker", "Widget fetch failed ($code) url=$urlStr body=${body.take(200)}")
        return Pair("$prefix: $short", "")
      }

      val json = JSONObject(body)
      val data = json.optJSONObject("data")
      if (data == null) return Pair("", "")

      val content = data.optString("content", "")
      val sender = data.optString("sender_email", "")
      val createdAt = data.optString("created_at", "")
      val meta = listOf(sender, createdAt).filter { it.isNotBlank() }.joinToString(" • ")
      Pair(content, meta)
    } catch (_: Exception) {
      Log.w("WidgetUpdateWorker", "Widget fetch exception url=$urlStr", _)
      Pair("Impossible de récupérer le message.", "")
    } finally {
      conn.disconnect()
    }
  }

  companion object {
    const val KEY_WIDGET_IDS = "widget_ids"
  }
}
