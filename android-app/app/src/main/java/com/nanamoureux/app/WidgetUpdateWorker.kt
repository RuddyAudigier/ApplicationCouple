package com.nanamoureux.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

class WidgetUpdateWorker(
  appContext: Context,
  params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

  override suspend fun doWork(): Result {
    val loop = inputData.getBoolean(KEY_LOOP, false)
    val ids = inputData.getIntArray(KEY_WIDGET_IDS)
    val appWidgetIds = if (ids != null && ids.isNotEmpty()) ids else {
      val mgr = AppWidgetManager.getInstance(applicationContext)
      mgr.getAppWidgetIds(ComponentName(applicationContext, PoetryWidgetProvider::class.java))
    }

    val mgr = AppWidgetManager.getInstance(applicationContext)
    if (appWidgetIds.isEmpty()) return Result.success()

    val apiUrl = Prefs.getApiUrl(applicationContext).ifBlank { BuildConfig.DEFAULT_APP_URL }
    val token = Prefs.getToken(applicationContext)
    val recipient = Prefs.getRecipient(applicationContext)

    if (token.isBlank() || recipient.isBlank()) {
    for (id in appWidgetIds) {
      val views = RemoteViews(applicationContext.packageName, R.layout.widget_poetry)
      views.setTextViewText(R.id.widgetTitle, "Nanamoureux")
      views.setTextViewText(R.id.widgetContent, "Ouvre l’app pour configurer le widget.")
      views.setOnClickPendingIntent(R.id.widgetRoot, buildOpenAppIntent())
      mgr.updateAppWidget(id, views)
    }
      return Result.success()
    }

    val url = buildWidgetUrl(apiUrl, token, recipient)
    val (content, meta) = fetchLatest(url)

    val displayContent = content.ifBlank { "Aucun mot pour le moment." }
    val prevContent = Prefs.getLastWidgetContent(applicationContext)
    val prevMeta = Prefs.getLastWidgetMeta(applicationContext)
    val changed = displayContent != prevContent || meta != prevMeta

    // Évite le clignotement: ne pas re-rendre si rien n’a changé.
    if (changed) {
      for (id in appWidgetIds) {
        val views = RemoteViews(applicationContext.packageName, R.layout.widget_poetry)
        views.setTextViewText(R.id.widgetTitle, "Nanamoureux")
        views.setTextViewText(R.id.widgetContent, displayContent)
        views.setTextViewText(R.id.widgetMeta, meta)
        views.setOnClickPendingIntent(R.id.widgetRoot, buildOpenAppIntent())
        mgr.updateAppWidget(id, views)
      }
      Prefs.setLastWidgetState(applicationContext, displayContent, meta)
    }

    if (loop) scheduleNextLoop()

    return Result.success()
  }

  private fun buildWidgetUrl(apiUrl: String, token: String, recipient: String): String {
    val base = apiUrl.trim().removeSuffix("/")
    return "$base/api/poesie-widget?token=${encode(token)}&recipient=${encode(recipient)}"
  }

  private fun encode(value: String): String =
    java.net.URLEncoder.encode(value, "UTF-8")

  private fun buildOpenAppIntent(): PendingIntent {
    val base = Prefs.getAppUrl(applicationContext).ifBlank { BuildConfig.DEFAULT_APP_URL }.trim().removeSuffix("/")
    val intent = Intent(applicationContext, WebAppActivity::class.java).apply {
      putExtra(WebAppActivity.EXTRA_URL, base)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    return PendingIntent.getActivity(
      applicationContext,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun fetchLatest(urlStr: String): Pair<String, String> {
    val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"
      connectTimeout = 8000
      readTimeout = 8000
    }

    return try {
      val code = conn.responseCode
      val body = (if (code in 200..299) conn.inputStream else conn.errorStream).bufferedReader().use { it.readText() }
      if (code !in 200..299) return Pair("Erreur ($code)", "")

      val json = JSONObject(body)
      val data = json.optJSONObject("data") ?: return Pair("", "")
      val content = data.optString("content", "")
      val sender = data.optString("sender_email", "")
      val createdAt = data.optString("created_at", "")
      val meta = listOf(sender, createdAt).filter { it.isNotBlank() }.joinToString(" • ")
      Pair(content, meta)
    } catch (_: Exception) {
      Pair("Pas de connexion.", "")
    } finally {
      conn.disconnect()
    }
  }

  companion object {
    const val KEY_WIDGET_IDS = "widget_ids"
    const val KEY_LOOP = "loop"
  }

  private fun scheduleNextLoop() {
    val data = Data.Builder()
      .putBoolean(KEY_LOOP, true)
      .build()

    val req = OneTimeWorkRequestBuilder<WidgetUpdateWorker>()
      .setInputData(data)
      .setInitialDelay(5, TimeUnit.MINUTES)
      .build()

    // Garde un seul "loop" actif.
    WorkManager.getInstance(applicationContext).enqueueUniqueWork(
      "nanamoureux_widget_update_loop",
      ExistingWorkPolicy.REPLACE,
      req,
    )
  }
}
