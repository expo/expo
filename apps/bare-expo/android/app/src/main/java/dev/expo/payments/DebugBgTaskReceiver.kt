package dev.expo.payments

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import expo.modules.backgroundtask.BackgroundTaskScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class DebugBgTaskReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "DebugBgTaskReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()
        Log.i(TAG, "Received broadcast, triggering background task")
        CoroutineScope(Dispatchers.Default).launch {
            try {
                BackgroundTaskScheduler.runTasks(
                    context.applicationContext,
                    context.applicationContext.packageName
                )
                Log.i(TAG, "Background task completed")
            } catch (e: Exception) {
                Log.e(TAG, "Background task failed: ${e.message}", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
