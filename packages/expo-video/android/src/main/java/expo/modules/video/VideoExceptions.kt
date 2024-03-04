package expo.modules.video

import expo.modules.kotlin.exception.CodedException
import expo.modules.video.enums.DRMType

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

internal class UnsupportedDRMTypeException(type: DRMType) :
  CodedException("DRM type `$type` is not supported on Android")
