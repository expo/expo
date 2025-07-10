package expo.modules.video.utils

import android.app.Activity
import android.app.PictureInPictureParams
import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.util.Rational
import androidx.annotation.OptIn
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import expo.modules.video.PictureInPictureConfigurationException
import expo.modules.video.VideoView.Companion.isPictureInPictureSupported
import expo.modules.video.enums.ContentFit

@OptIn(UnstableApi::class)
internal fun calculateRectHint(playerView: PlayerView): Rect {
  val hint = Rect()
  playerView.videoSurfaceView?.getGlobalVisibleRect(hint)
  val location = IntArray(2)
  playerView.videoSurfaceView?.getLocationOnScreen(location)

  // getGlobalVisibleRect doesn't take into account the offset for the notch, we use the screen location
  // of the view to calculate the rectHint.
  // We only apply this correction on the y axis due to something that looks like a bug in the Android SDK.
  // If the video screen and home screen have the same orientation this works correctly,
  // but if the home screen doesn't support landscape and the video screen does, we have to
  // ignore the offset for the notch on the x axis even though it's present on the video screen
  // because there will be no offset on the home screen
  // there is no way to check the orientation support of the home screen, so we make the bet that
  // it won't support landscape (as most android home screens do by default)
  // This doesn't have any serious consequences if we are wrong with the guess, the transition will be a bit off though
  val height = hint.bottom - hint.top
  hint.top = location[1]
  hint.bottom = hint.top + height
  return hint
}

internal fun calculatePiPAspectRatio(videoSize: VideoSize, viewWidth: Int, viewHeight: Int, contentFit: ContentFit): Rational {
  var aspectRatio = if (contentFit == ContentFit.CONTAIN) {
    Rational(videoSize.width, videoSize.height)
  } else {
    Rational(viewWidth, viewHeight)
  }
  // AspectRatio for the activity in picture-in-picture, must be between 2.39:1 and 1:2.39 (inclusive).
  // https://developer.android.com/reference/android/app/PictureInPictureParams.Builder#setAspectRatio(android.util.Rational)
  val maximumRatio = Rational(239, 100)
  val minimumRatio = Rational(100, 239)

  if (aspectRatio.toFloat() > maximumRatio.toFloat()) {
    aspectRatio = maximumRatio
  } else if (aspectRatio.toFloat() < minimumRatio.toFloat()) {
    aspectRatio = minimumRatio
  }
  return aspectRatio
}

internal fun applyRectHint(activity: Activity, rectHint: Rect) {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPictureInPictureSupported(activity)) {
    runWithPiPMisconfigurationSoftHandling {
      activity.setPictureInPictureParams(PictureInPictureParams.Builder().setSourceRectHint(rectHint).build())
    }
  }
}

// We can't check if AndroidManifest.xml is configured properly, so we have to handle the exceptions ourselves to prevent crashes
internal fun runWithPiPMisconfigurationSoftHandling(shouldThrow: Boolean = false, block: () -> Any?) {
  try {
    block()
  } catch (e: IllegalStateException) {
    Log.e("ExpoVideo", "Current activity does not support picture-in-picture. Make sure you have configured the `expo-video` config plugin correctly.")
    if (shouldThrow) {
      throw PictureInPictureConfigurationException()
    }
  }
}

internal fun applyPiPParams(activity: Activity, autoEnterPiP: Boolean, aspectRatio: Rational? = null) {
  // If the aspect ratio exceeds the limits, the app will crash
  val safeAspectRatio = aspectRatio?.takeIf { it.toFloat() in 0.41841..2.39 }

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPictureInPictureSupported(activity)) {
    val paramsBuilder = PictureInPictureParams.Builder()

    safeAspectRatio?.let {
      paramsBuilder.setAspectRatio(it)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      paramsBuilder.setAutoEnterEnabled(autoEnterPiP)
    }
    runWithPiPMisconfigurationSoftHandling {
      activity.setPictureInPictureParams(paramsBuilder.build())
    }
  }
}
