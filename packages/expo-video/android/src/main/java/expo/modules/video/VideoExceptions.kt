package expo.modules.video

import expo.modules.kotlin.exception.CodedException

internal class FullScreenVideoViewNotFoundException :
  CodedException("VideoView id wasn't passed to the activity")

internal class VideoViewNotFoundException(id: String) :
  CodedException("VideoView with id: $id not found")
