package com.nanamoureux.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class PoetryWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)
    // Ne pas écraser l'affichage actuel avec un "loading" (évite le clignotement).
    enqueueUpdate(context, appWidgetIds)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == ACTION_REFRESH) {
      val ids = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
      if (ids != null && ids.isNotEmpty()) enqueueUpdate(context, ids) else requestUpdateNow(context)
    }
  }

  private fun enqueueUpdate(context: Context, appWidgetIds: IntArray) {
    val data = Data.Builder()
      .putIntArray(WidgetUpdateWorker.KEY_WIDGET_IDS, appWidgetIds)
      .build()

    val req = OneTimeWorkRequestBuilder<WidgetUpdateWorker>()
      .setInputData(data)
      .build()

    WorkManager.getInstance(context).enqueueUniqueWork("nanamoureux_widget_update", ExistingWorkPolicy.REPLACE, req)
  }

  companion object {
    const val ACTION_REFRESH = "com.nanamoureux.widget.REFRESH"

    fun requestUpdateNow(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, PoetryWidgetProvider::class.java)
      val ids = mgr.getAppWidgetIds(component)
      if (ids.isEmpty()) return
      val intent = Intent(context, PoetryWidgetProvider::class.java).apply {
        action = ACTION_REFRESH
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      }
      context.sendBroadcast(intent)
    }

    fun buildOpenAppIntent(context: Context): PendingIntent? {
      val url = Prefs.getAppUrl(context)
      if (url.isBlank()) return null
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
      return PendingIntent.getActivity(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    fun buildComposeUrl(context: Context): String {
      val raw = Prefs.getAppUrl(context).trim()
      if (raw.isBlank()) return ""
      return try {
        val uri = Uri.parse(raw)
        val origin = uri.buildUpon().path("").clearQuery().fragment("").build().toString().removeSuffix("/")
        "$origin/page4?compose=1&mode=to_partner"
      } catch (_: Exception) {
        raw
      }
    }

    fun buildComposeWebIntent(context: Context): PendingIntent? {
      val url = buildComposeUrl(context)
      if (url.isBlank()) return null
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
      return PendingIntent.getActivity(
        context,
        1,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
  }
}
