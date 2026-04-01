package com.nanamoureux.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.Data
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class PoetryWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)
    enqueueUpdate(context, appWidgetIds)
    ensureLoopScheduled(context)
  }

  override fun onEnabled(context: Context) {
    super.onEnabled(context)
    ensureLoopScheduled(context)
  }

  override fun onDisabled(context: Context) {
    super.onDisabled(context)
    WorkManager.getInstance(context).cancelUniqueWork(WORK_NOW)
    WorkManager.getInstance(context).cancelUniqueWork(WORK_LOOP)
  }

  private fun enqueueUpdate(context: Context, appWidgetIds: IntArray) {
    val data = Data.Builder()
      .putIntArray(WidgetUpdateWorker.KEY_WIDGET_IDS, appWidgetIds)
      .build()

    val req = OneTimeWorkRequestBuilder<WidgetUpdateWorker>()
      .setInputData(data)
      .build()

    WorkManager.getInstance(context).enqueueUniqueWork(WORK_NOW, ExistingWorkPolicy.REPLACE, req)
  }

  private fun ensureLoopScheduled(context: Context) {
    val data = Data.Builder()
      .putBoolean(WidgetUpdateWorker.KEY_LOOP, true)
      .build()

    // Best-effort: toutes les 5 minutes. Android peut retarder en arrière-plan.
    val req = OneTimeWorkRequestBuilder<WidgetUpdateWorker>()
      .setInputData(data)
      .setInitialDelay(5, TimeUnit.MINUTES)
      .build()

    WorkManager.getInstance(context).enqueueUniqueWork(WORK_LOOP, ExistingWorkPolicy.REPLACE, req)
  }

  companion object {
    private const val WORK_NOW = "nanamoureux_widget_update_now"
    private const val WORK_LOOP = "nanamoureux_widget_update_loop"

    fun requestUpdateNow(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, PoetryWidgetProvider::class.java)
      val ids = mgr.getAppWidgetIds(component)
      if (ids.isEmpty()) return
      val intent = Intent(context, PoetryWidgetProvider::class.java).apply {
        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      }
      context.sendBroadcast(intent)
    }
  }
}
