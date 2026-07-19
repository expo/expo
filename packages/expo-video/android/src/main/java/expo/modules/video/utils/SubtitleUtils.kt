package expo.modules.video.utils

import android.content.Context
import android.util.TypedValue
import android.view.accessibility.CaptioningManager
import androidx.media3.ui.CaptionStyleCompat
import androidx.media3.ui.PlayerView

object SubtitleUtils {
  /**
   * Configures the PlayerView's subtitle view to fix sizing issues with embedded styles.
   * Disables embedded HLS subtitle styling and applies Android accessibility settings
   * with a reasonable base font size.
   */
  fun configureSubtitleView(playerView: PlayerView, context: Context) {
    playerView.subtitleView?.apply {
      setApplyEmbeddedStyles(false)
      setApplyEmbeddedFontSizes(false)

      // Apply system accessibility caption style but with reasonable base font size
      val captioningManager = context.getSystemService(Context.CAPTIONING_SERVICE) as? CaptioningManager
      val userStyle = captioningManager?.userStyle

      if (userStyle != null) {
        val systemStyle = CaptionStyleCompat.createFromCaptionStyle(userStyle)
        setStyle(systemStyle)

        val fontScale = captioningManager.fontScale
        val baseFontSize = 16f // Reasonable base size
        setFixedTextSize(TypedValue.COMPLEX_UNIT_SP, baseFontSize * fontScale)
      }
    }
  }

  /**
   * Creates a CaptioningChangeListener that reconfigures subtitles when accessibility
   * settings change.
   */
  fun createCaptioningChangeListener(
    playerView: PlayerView,
    context: Context
  ): CaptioningManager.CaptioningChangeListener {
    return object : CaptioningManager.CaptioningChangeListener() {
      override fun onEnabledChanged(enabled: Boolean) {
        configureSubtitleView(playerView, context)
      }

      override fun onUserStyleChanged(userStyle: android.view.accessibility.CaptioningManager.CaptionStyle) {
        configureSubtitleView(playerView, context)
      }

      override fun onFontScaleChanged(fontScale: Float) {
        configureSubtitleView(playerView, context)
      }
    }
  }
}
