package expo.modules.ui.convertibles

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue

@Composable
fun resolveAnimatable(map: Map<String, Any?>, key: String, default: Float): Float {
  val raw = map[key]
  val targetValue = when {
    raw is Number -> raw.toFloat()
    raw is Map<*, *> && raw["\$animated"] == true ->
      (raw["targetValue"] as Number).toFloat()
    else -> default
  }
  val spec: AnimationSpec<Float> = when {
    raw is Map<*, *> && raw["\$animated"] == true ->
      parseAnimationSpec(raw["animationSpec"]) ?: spring()
    else -> snap()
  }
  val animated by animateFloatAsState(targetValue, spec, label = key)
  return animated
}
