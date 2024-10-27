package expo.modules.camera

import expo.modules.kotlin.exception.CodedException

class CameraExceptions {
  class ImageCaptureFailed : CodedException(message = "Failed to capture image")

  class VideoRecordingFailed(cause: String?) : CodedException("Video recording failed: $cause")

  class ImageRetrievalException(url: String) :
    CodedException("Could not get the image from given url: '$url'")

  class UnsupportedAspectRatioException(aspectRatio: String) :
    CodedException("Unsupported aspect ratio: '$aspectRatio'")
}
