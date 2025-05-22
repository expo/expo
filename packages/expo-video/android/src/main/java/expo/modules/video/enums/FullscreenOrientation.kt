package expo.modules.video.enums
import expo.modules.kotlin.types.Enumerable
import android.content.pm.ActivityInfo

enum class FullscreenOrientation(val value: String) : Enumerable {
  LANDSCAPE("landscape"),
  PORTRAIT("portrait"),
  LANDSCAPE_LEFT("landscapeLeft"),
  LANDSCAPE_RIGHT("landscapeRight"),
  PORTRAIT_UP("portraitUp"),
  PORTRAIT_DOWN("portraitDown"),
  DEFAULT("default");

  fun toActivityOrientation(): Int {
    return when (this) {
      LANDSCAPE -> ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE
      PORTRAIT -> ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT
      LANDSCAPE_LEFT -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
      LANDSCAPE_RIGHT -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
      PORTRAIT_UP -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      PORTRAIT_DOWN -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
      DEFAULT -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }
  }
}
