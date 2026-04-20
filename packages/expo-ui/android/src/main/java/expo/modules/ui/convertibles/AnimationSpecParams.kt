package expo.modules.ui.convertibles

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.recordFromMap
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

internal enum class EasingType(val value: String) : Enumerable {
  LINEAR("linear"),
  FAST_OUT_SLOW_IN("fastOutSlowIn"),
  FAST_OUT_LINEAR_IN("fastOutLinearIn"),
  LINEAR_OUT_SLOW_IN("linearOutSlowIn"),
  EASE("ease");

  fun toEasing() = when (this) {
    LINEAR -> LinearEasing
    FAST_OUT_SLOW_IN -> FastOutSlowInEasing
    FAST_OUT_LINEAR_IN -> FastOutLinearInEasing
    LINEAR_OUT_SLOW_IN -> LinearOutSlowInEasing
    EASE -> EaseInOut
  }
}

@OptimizedRecord
internal data class SpringSpecParams(
  @Field val dampingRatio: Float = Spring.DampingRatioNoBouncy,
  @Field val stiffness: Float = Spring.StiffnessMedium,
  @Field val visibilityThreshold: Float? = null
) : Record {
  fun toAnimationSpec(): AnimationSpec<Float> = spring(
    dampingRatio = dampingRatio,
    stiffness = stiffness,
    visibilityThreshold = visibilityThreshold
  )
}

@OptimizedRecord
internal data class TweenSpecParams(
  @Field val durationMillis: Int = 300,
  @Field val delayMillis: Int = 0,
  @Field val easing: EasingType? = null
) : Record {
  fun toAnimationSpec(): AnimationSpec<Float> = tween(
    durationMillis = durationMillis,
    delayMillis = delayMillis,
    easing = easing?.toEasing() ?: FastOutSlowInEasing
  )
}

@OptimizedRecord
internal data class SnapSpecParams(
  @Field val delayMillis: Int = 0
) : Record {
  fun toAnimationSpec(): AnimationSpec<Float> = snap(delayMillis = delayMillis)
}

@OptimizedRecord
internal data class KeyframesSpecParams(
  @Field val durationMillis: Int = 300,
  @Field val delayMillis: Int = 0
) : Record {
  @Suppress("UNCHECKED_CAST")
  fun toAnimationSpec(raw: Map<*, *>): AnimationSpec<Float> {
    val kf = raw["keyframes"] as? Map<String, Number> ?: emptyMap()
    return keyframes {
      this.durationMillis = this@KeyframesSpecParams.durationMillis
      this.delayMillis = this@KeyframesSpecParams.delayMillis
      for ((time, value) in kf) {
        value.toFloat() at time.toInt()
      }
    }
  }
}

@Suppress("UNCHECKED_CAST")
internal fun parseAnimationSpec(raw: Any?): AnimationSpec<Float>? {
  if (raw !is Map<*, *>) return null
  val map = raw as Map<String, Any?>
  return when (raw["\$type"]) {
    "spring" -> recordFromMap<SpringSpecParams>(map).toAnimationSpec()
    "tween" -> recordFromMap<TweenSpecParams>(map).toAnimationSpec()
    "snap" -> recordFromMap<SnapSpecParams>(map).toAnimationSpec()
    "keyframes" -> recordFromMap<KeyframesSpecParams>(map).toAnimationSpec(raw)
    else -> null
  }
}
