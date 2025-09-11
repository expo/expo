package expo.modules.video

import expo.modules.kotlin.exception.CodedException
import expo.modules.video.enums.DRMType

private const val defaultServiceBindingTip = "Make sure that the expo-video config plugin is properly configured to avoid issues with displaying the now playing notification and sustaining background playback."

internal class FullScreenVideoViewNotFoundException :
  CodedException("VideoView id wasn't passed to the activity")

internal class FullScreenOptionsNotFoundException :
  CodedException("Fullscreen options were not passed to the activity")

internal class VideoViewNotFoundException(id: String) :
  CodedException("VideoView with id: $id not found")

internal class MethodUnsupportedException(methodName: String) :
  CodedException("Method `$methodName` is not supported on Android")

internal class PictureInPictureEnterException(message: String?) :
  CodedException("Failed to enter Picture in Picture mode${message?.let { ". $message" } ?: ""}")

internal class PictureInPictureConfigurationException :
  CodedException("Current activity does not support picture-in-picture. Make sure you have configured the `expo-video` config plugin correctly.")

internal class PictureInPictureUnsupportedException :
  CodedException("Picture in Picture mode is not supported on this device")

internal class UnsupportedDRMTypeException(type: DRMType) :
  CodedException("DRM type `$type` is not supported on Android")

internal class PlaybackException(reason: String?, cause: Throwable? = null) :
  CodedException("A playback exception has occurred: ${reason ?: "reason unknown"}", cause)

internal class FailedToGetAudioFocusManagerException :
  CodedException("Failed to get AudioFocusManager service")

internal class VideoCacheException(message: String?, cause: Throwable? = null) :
  CodedException(message ?: "Unexpected expo-video cache error", cause)

internal class NowPlayingException(message: String?, cause: Throwable? = null) :
  CodedException(message ?: "Unexpected expo-video now playing exception", cause)

internal fun getPlaybackServiceErrorMessage(message: String?, tip: String = defaultServiceBindingTip) =
  (message ?: "Expo-video playback service binder error") + ". $tip"
