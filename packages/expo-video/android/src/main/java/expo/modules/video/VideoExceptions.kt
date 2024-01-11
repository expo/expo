package expo.modules.video

import expo.modules.kotlin.exception.CodedException

internal class FullScreenVideoViewNotFoundException :
  CodedException("VideoView id wasn't passed to the activity")

internal class VideoViewNotFoundException(id: String) :
  CodedException("VideoView with id: $id not found")

internal class MethodUnsupportedException(methodName: String) :
  CodedException("Method `$methodName` is not supported on Android")

internal class PictureInPictureEnterException(message: String?) :
  CodedException("Failed to enter Picture in Picture mode${message?.let { ". $message" } ?: ""}")

internal class PictureInPictureUnsupportedException :
  CodedException("Picture in Picture mode is not supported on this device")
