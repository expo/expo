import ExpoModulesCore

internal class FileSystemReadPermissionException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not readable"
  }
}

internal class ImageWriteFailedException: GenericException<String> {
  override var reason: String {
    "Writing image data to the file has failed: \(param)"
  }
}

internal class CorruptedImageDataException: Exception {
  override var reason: String {
    "Cannot create image data for saving of the thumbnail of the given video"
  }
}
