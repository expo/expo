package expo.modules.camera

import expo.modules.kotlin.exception.CodedException

class CameraExceptions {
  class ImageCaptureFailed : CodedException(message = "Failed to capture image")

  class VideoRecordingFailed(cause: String?) : CodedException("Video recording failed: $cause")

  class ImageRetrievalException(url: String) :
    CodedException("Could not get the image from given url: '$url'")

  // R8 renames these classes in release builds, so a code inferred from the class name changes.
  class BarcodeScanningCancelledException() :
    CodedException("ERR_BARCODE_SCANNING_CANCELLED", "Barcode scanning was cancelled", null)

  class BarcodeScanningFailedException :
    CodedException("ERR_BARCODE_SCANNING_FAILED", "Barcode scanning failed", null)

  class MLKitUnavailableException :
    CodedException("MLKit is not available on this device. Barcode scanning requires Google Play Services.")

  class GooglePlayServicesUnavailableException :
    CodedException("Google Play Services is not available on this device. This feature requires Google Play Services.")

  class WriteImageException(cause: String?) : CodedException("Writing image has failed: $cause")

  class DocumentScannerUnavailableException :
    CodedException("Document scanning is unavailable. It requires Google Play Services and the ML Kit document scanner module. Check `CameraView.isDocumentScannerAvailable` before calling `scanDocumentAsync`.")

  class DocumentScanningFailedException(cause: String?) :
    CodedException("Document scanning failed: $cause")
}
