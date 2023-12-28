package expo.modules.video

import android.view.View
import androidx.media3.ui.DefaultTimeBar
import androidx.media3.ui.PlayerView

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
internal fun PlayerView.applyRequiresLinearPlayback(requireLinearPlayback: Boolean) {
  setShowFastForwardButton(!requireLinearPlayback)
  setShowRewindButton(!requireLinearPlayback)
  setShowPreviousButton(!requireLinearPlayback)
  setShowNextButton(!requireLinearPlayback)

  // TODO: Make the requiresLinearPlayback hide only the scrubber instead of the whole progress bar. Maybe use custom layout for the player as the scrubber is not available?
  val progressBar = findViewById<View>(androidx.media3.ui.R.id.exo_progress)
  if (progressBar is DefaultTimeBar) {
    progressBar.visibility = if (requireLinearPlayback) View.GONE else View.VISIBLE
  }
}
