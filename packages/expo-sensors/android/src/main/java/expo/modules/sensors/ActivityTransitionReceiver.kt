package expo.modules.sensors

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionResult
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.nanoseconds

/**
 * A change from walking to running is an exit and an enter, but the user did not stop.
 * So the receiver sends an event only when the user changes between moving and not moving.
 */
internal class ActivityTransitionReceiver(
  private val onEvent: (PedometerActivityEvent) -> Unit
) : BroadcastReceiver() {
  private val activeActivityTypes = mutableSetOf<Int>()
  private var isMoving: Boolean? = null

  override fun onReceive(context: Context?, intent: Intent?) {
    if (intent == null || !ActivityTransitionResult.hasResult(intent)) {
      return
    }
    val events = ActivityTransitionResult.extractResult(intent)
      ?.transitionEvents
      ?.filter { it.activityType in MovingActivityTypes }
      ?.sortedBy { it.elapsedRealTimeNanos }
    if (events.isNullOrEmpty()) {
      return
    }

    for (event in events) {
      if (event.transitionType == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {
        activeActivityTypes.add(event.activityType)
      } else {
        activeActivityTypes.remove(event.activityType)
      }
    }

    val isMovingNow = activeActivityTypes.isNotEmpty()
    if (isMovingNow == isMoving) {
      return
    }
    isMoving = isMovingNow

    val (type, transitionType) = if (isMovingNow) {
      "resume" to ActivityTransition.ACTIVITY_TRANSITION_ENTER
    } else {
      "pause" to ActivityTransition.ACTIVITY_TRANSITION_EXIT
    }
    val event = events.lastOrNull { it.transitionType == transitionType } ?: events.last()

    val eventAge = (SystemClock.elapsedRealtimeNanos() - event.elapsedRealTimeNanos).nanoseconds
    val date = (System.currentTimeMillis() - eventAge.inWholeMilliseconds).milliseconds
    onEvent(PedometerActivityEvent(type = type, date = date))
  }
}