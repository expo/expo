package expo.modules.sensors

import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.DetectedActivity

const val TaskTimeoutSeconds = 30L

const val DefaultUpdateInterval = 100L

val MovingActivityTypes = listOf(DetectedActivity.WALKING, DetectedActivity.RUNNING)

val ActivityTransitions = listOf(
  ActivityTransition.ACTIVITY_TRANSITION_ENTER,
  ActivityTransition.ACTIVITY_TRANSITION_EXIT
)
