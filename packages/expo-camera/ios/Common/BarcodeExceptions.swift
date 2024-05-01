import ExpoModulesCore

internal class ImageLoaderNotFound: Exception {
  override var reason: String {
    "Image Loader module not found"
  }
}

internal class FailedToLoadImage: Exception {
  override var reason: String {
    "Could not get the image"
  }
}

internal class InitScannerFailed: Exception {
  override var reason: String {
    "Could not initialize the barcode scanner"
  }
}
