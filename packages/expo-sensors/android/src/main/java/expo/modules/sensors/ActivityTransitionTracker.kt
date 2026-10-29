package expo.modules.sensors

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.core.app.PendingIntentCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionRequest
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContextOrNull

private const val TransitionAction = "expo.modules.sensors.PEDOMETER_TRANSITION"

/** Sends `resume` and `pause` events from the Activity Recognition transition API. Not thread-safe. */
internal class ActivityTransitionTracker(
  private val contextProvider: () -> Context?,
  private val onEvent: (PedometerActivityEvent) -> Unit
) {
  private class Updates(val pendingIntent: PendingIntent, val receiver: ActivityTransitionReceiver)

  /** Not null while the updates are on. */
  private var updates: Updates? = null

  fun isAvailable(): Boolean {
    val context = contextProvider() ?: return false
    return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
  }

  /** Returns false when Google Play services is not available. */
  // `awaitTask` converts a `SecurityException` to a missing permission error. Lint does not see that.
  @SuppressLint("MissingPermission")
  suspend fun start(): Boolean {
    if (updates != null) {
      return true
    }

    if (!isAvailable()) {
      return false
    }

    val context = contextProvider()
      ?: return false

    val receiver = ActivityTransitionReceiver(onEvent)
    ContextCompat.registerReceiver(
      context,
      receiver,
      IntentFilter(TransitionAction),
      ContextCompat.RECEIVER_NOT_EXPORTED
    )
    val intent = Intent(TransitionAction)
      .setPackage(context.packageName)
    val pendingIntent = PendingIntentCompat
      .getBroadcast(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT,
        true
      )
    requireNotNull(pendingIntent)

    try {
      awaitTask("start event updates") {
        ActivityRecognition
          .getClient(context)
          .requestActivityTransitionUpdates(createRequest(), pendingIntent)
      }
    } catch (e: Throwable) {
      pendingIntent.cancel()
      unregister(context, receiver)
      throw e
    }

    updates = Updates(pendingIntent, receiver)
    return true
  }

  fun stop() {
    val updates = updates ?: return
    this.updates = null
    val context = contextProvider()
    if (context == null) {
      updates.pendingIntent.cancel()
      return
    }
    try {
      ActivityRecognition
        .getClient(context)
        .removeActivityTransitionUpdates(updates.pendingIntent)
    } catch (_: SecurityException) {
      updates.pendingIntent.cancel()
    }
    unregister(context, updates.receiver)
  }

  private fun unregister(context: Context, receiver: ActivityTransitionReceiver) {
    try {
      context.unregisterReceiver(receiver)
    } catch (_: IllegalArgumentException) {
      // Receiver already unregistered.
    }
  }

  private fun createRequest() = ActivityTransitionRequest(
    MovingActivityTypes.flatMap { activityType ->
      ActivityTransitions.map { transition ->
        ActivityTransition.Builder()
          .setActivityType(activityType)
          .setActivityTransition(transition)
          .build()
      }
    }
  )

}

internal fun Module.createActivityTransitionTracker(onEvent: (PedometerActivityEvent) -> Unit) =
  ActivityTransitionTracker({ androidContextOrNull }, onEvent)
