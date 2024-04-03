package expo.modules.video

import android.graphics.Color
import androidx.media3.ui.DefaultTimeBar
import androidx.media3.ui.PlayerView

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
internal fun PlayerView.applyRequiresLinearPlayback(requireLinearPlayback: Boolean) {
  setShowFastForwardButton(!requireLinearPlayback)
  setShowRewindButton(!requireLinearPlayback)
  setShowPreviousButton(!requireLinearPlayback)
  setShowNextButton(!requireLinearPlayback)
  setTimeBarInteractive(requireLinearPlayback)
}

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
internal fun PlayerView.setTimeBarInteractive(interactive: Boolean) {
  val timeBar = findViewById<DefaultTimeBar>(androidx.media3.ui.R.id.exo_progress)
  if (interactive) {
    timeBar?.setScrubberColor(Color.TRANSPARENT)
    timeBar?.isEnabled = false
  } else {
    timeBar?.setScrubberColor(Color.WHITE)
    timeBar?.isEnabled = true
  }
}

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
internal fun PlayerView.setFullscreenButtonVisibility(visible: Boolean) {
  val fullscreenButton = findViewById<android.widget.ImageButton>(androidx.media3.ui.R.id.exo_fullscreen)
  fullscreenButton?.visibility = if (visible) {
    android.view.View.VISIBLE
  } else {
    android.view.View.GONE
  }
}
