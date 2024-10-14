package expo.modules.video.utils

import android.app.Activity
import android.app.PictureInPictureParams
import android.graphics.Rect
import android.os.Build
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import expo.modules.video.PictureInPictureConfigurationException
import expo.modules.video.VideoView.Companion.isPictureInPictureSupported

@OptIn(UnstableApi::class)
internal fun calculateRectHint(playerView: PlayerView): Rect {
  val hint = Rect()
  playerView.videoSurfaceView?.getGlobalVisibleRect(hint)
  val location3 = IntArray(2)
  playerView.videoSurfaceView?.getLocationOnScreen(location3)

  // getGlobalVisibleRect doesn't take into account the offset for the notch, we use the screen location
  // of the view to calculate the rectHint.
  // We only apply this correction on the y axis due to something that looks like a bug in the Android SDK
  // basically if the video screen and home screen have the same orientation  this works correctly,
  // but if the home screen doesn't support landscape and the video screen does, we have to
  // ignore the offset for the notch on the x axis even though it's present on the video screen
  // because there will be no offset on the home screen
  // there is no way to check the orientation support of the home screen, so we make the bet that
  // it won't support landscape (as most android home screens do by default)
  // This doesn't have any serious consequences if we are wrong with the guess, the transition will be a bit off though
  val height = hint.bottom - hint.top
  hint.top = location3[1]
  hint.bottom = hint.top + height
  return hint
}

internal fun applyRectHint(activity: Activity, rectHint: Rect) {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPictureInPictureSupported(activity)) {
    runWithPiPMisconfigurationSoftHandling(ignore = true) {
      activity.setPictureInPictureParams(PictureInPictureParams.Builder().setSourceRectHint(rectHint).build())
    }
  }
}

// We can't check if AndroidManifest.xml is configured properly, so we have to handle the exceptions ourselves to prevent crashes
internal fun runWithPiPMisconfigurationSoftHandling(shouldThrow: Boolean = false, ignore: Boolean = false, block: () -> Any?) {
  try {
    block()
  } catch (e: IllegalStateException) {
    if (ignore) {
      return
    }
    Log.e("ExpoVideo", "Current activity does not support picture-in-picture. Make sure you have configured the `expo-video` config plugin correctly.")
    if (shouldThrow) {
      throw PictureInPictureConfigurationException()
    }
  }
}

internal fun applyAutoEnterPiP(activity: Activity, autoEnterPiP: Boolean) {
  if (Build.VERSION.SDK_INT >= 31 && isPictureInPictureSupported(activity)) {
    runWithPiPMisconfigurationSoftHandling {
      activity.setPictureInPictureParams(PictureInPictureParams.Builder().setAutoEnterEnabled(autoEnterPiP).build())
    }
  }
}
