package expo.modules.camera

import expo.modules.kotlin.exception.CodedException

class CameraExceptions {
  class ImageCaptureFailed : CodedException(message = "Failed to capture image")

  class VideoRecordingFailed(cause: String?) : CodedException("Video recording failed: $cause")

  class ImageRetrievalException(url: String) :
    CodedException("Could not get the image from given url: '$url'")

  class BarcodeScanningCancelledException() :
    CodedException("Barcode scanning was cancelled")

  class BarcodeScanningFailedException :
    CodedException("Barcode scanning failed")

  class MLKitUnavailableException :
    CodedException("MLKit is not available on this device. Barcode scanning requires Google Play Services.")

  class GooglePlayServicesUnavailableException :
    CodedException("Google Play Services is not available on this device. This feature requires Google Play Services.")

  class WriteImageException(cause: String?) : CodedException("Writing image has failed: $cause")
}
