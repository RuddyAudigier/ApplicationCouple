package com.nanamoureux.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
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

    val apiUrl = Prefs.getApiUrl(applicationContext)
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
    val base = apiUrl.trim().removeSuffix("/")
    val url = "$base/api/poesie-widget?token=${encode(token)}&recipient=${encode(recipient)}"
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
        val short = msg.trim().take(120)
        return Pair("Erreur widget ($code): $short", "")
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
      Pair("Impossible de récupérer le message.", "")
    } finally {
      conn.disconnect()
    }
  }

  companion object {
    const val KEY_WIDGET_IDS = "widget_ids"
  }
}
