import ExpoModulesCore

internal final class ImageLoaderNotFound: Exception {
  override var reason: String {
    "Image Loader module not found"
  }
}

internal final class FailedToLoadImage: Exception {
  override var reason: String {
    "Could not get the image"
  }
}

internal final class InitScannerFailed: Exception {
  override var reason: String {
    "Could not initialize the barcode scanner"
  }
}
