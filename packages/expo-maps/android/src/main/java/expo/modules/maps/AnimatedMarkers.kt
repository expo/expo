package expo.modules.maps

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import com.google.maps.android.compose.MarkerState

private const val MARKER_FADE_DURATION_MS = 200

private class ComposedMarkers(var markers: List<Pair<MarkerRecord, MarkerState>>)

/**
 * Composes [content] for every marker in [markers], fading a marker in when it is added and out
 * when it is removed. A removed marker stays composed until its fade-out has finished.
 *
 * Markers are matched between updates by [MarkerRecord.id]. The comparison with the previously
 * composed list happens during composition rather than in an effect, so a removed marker is never
 * dropped from the map before its fade-out starts.
 */
@Composable
internal fun AnimatedMarkers(
  markers: List<Pair<MarkerRecord, MarkerState>>,
  content: @Composable (marker: MarkerRecord, state: MarkerState, alpha: Float) -> Unit
) {
  val composed = remember { ComposedMarkers(markers) }
  val departing = remember { mutableStateMapOf<String, Pair<MarkerRecord, MarkerState>>() }

  if (composed.markers !== markers) {
    val currentIds = markers.map { (marker, _) -> marker.id }.toSet()
    for (entry in composed.markers) {
      if (entry.first.id !in currentIds) {
        departing[entry.first.id] = entry
      }
    }
    departing.keys.removeAll(currentIds)
    composed.markers = markers
  }

  val visible = markers.map { (marker, state) -> Triple(marker, state, false) } +
    departing.values.map { (marker, state) -> Triple(marker, state, true) }

  for ((marker, state, isDeparting) in visible) {
    key(marker.id) {
      val alpha = remember { Animatable(0f) }
      LaunchedEffect(isDeparting) {
        alpha.animateTo(if (isDeparting) 0f else 1f, tween(MARKER_FADE_DURATION_MS))
        if (isDeparting) {
          departing.remove(marker.id)
        }
      }
      content(marker, state, alpha.value)
    }
  }
}
