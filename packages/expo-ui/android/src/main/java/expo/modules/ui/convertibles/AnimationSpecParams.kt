package expo.modules.ui.convertibles

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.EaseInOut

internal fun parseAnimationSpec(raw: Any?): AnimationSpec<Float>? {
  if (raw !is Map<*, *>) return null
  return when (raw["\$type"]) {
    "spring" -> spring(
      dampingRatio = (raw["dampingRatio"] as? Number)?.toFloat() ?: Spring.DampingRatioNoBouncy,
      stiffness = (raw["stiffness"] as? Number)?.toFloat() ?: Spring.StiffnessMedium,
      visibilityThreshold = (raw["visibilityThreshold"] as? Number)?.toFloat()
    )
    "tween" -> tween(
      durationMillis = (raw["durationMillis"] as? Number)?.toInt() ?: 300,
      delayMillis = (raw["delayMillis"] as? Number)?.toInt() ?: 0,
      easing = parseEasing(raw["easing"] as? String)
    )
    "snap" -> snap(delayMillis = (raw["delayMillis"] as? Number)?.toInt() ?: 0)
    "keyframes" -> parseKeyframes(raw)
    else -> null
  }
}

private fun parseEasing(name: String?) = when (name) {
  "linear" -> LinearEasing
  "fastOutSlowIn" -> FastOutSlowInEasing
  "fastOutLinearIn" -> FastOutLinearInEasing
  "linearOutSlowIn" -> LinearOutSlowInEasing
  "ease" -> EaseInOut
  else -> FastOutSlowInEasing
}

@Suppress("UNCHECKED_CAST")
private fun parseKeyframes(raw: Map<*, *>): AnimationSpec<Float> {
  val durationMillis = (raw["durationMillis"] as? Number)?.toInt() ?: 300
  val delayMillis = (raw["delayMillis"] as? Number)?.toInt() ?: 0
  val kf = raw["keyframes"] as? Map<String, Number> ?: emptyMap()
  return keyframes {
    this.durationMillis = durationMillis
    this.delayMillis = delayMillis
    for ((time, value) in kf) {
      value.toFloat() at time.toInt()
    }
  }
}
