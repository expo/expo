import ExpoModulesCore

let defaultErrorMessage = "unspecified error"

internal class MediaLibraryPermissionsException: Exception {
  override var reason: String {
    "Media Library permission is required to do this operation"
  }
}

internal class EmptyFileExtensionException: Exception {
  override var reason: String {
    "Could not get the file's extension - it was empty."
  }
}

internal class UnsupportedAssetTypeException: GenericException<String> {
  override var reason: String {
    "This URL does not contain a valid asset type: \(param)"
  }
}

internal class UnreadableAssetException: GenericException<String> {
  override var reason: String {
    "File \(param) isn't readable"
  }
}

internal class SaveAssetException: GenericException<(any Error)?> {
  override var reason: String {
    "Asset couldn't be saved to photo library: \(param?.localizedDescription ?? defaultErrorMessage)"
  }
}

internal class MissingPListKeyException: GenericException<String> {
  override var reason: String {
    "This app is missing \(param). Add this entry to your bundle's Info.plist"
  }
}

internal class MissingFileException: GenericException<String> {
  override var reason: String {
    "Couldn't open file: \(param). Make sure if this file exists"
  }
}

internal class SaveVideoException: Exception {
  override var reason: String {
    "This video couldn't be saved to the Camera Roll album"
  }
}

internal class SaveAlbumException: GenericException<(any Error)?> {
  override var reason: String {
    "Couldn't add assets to album: \(param?.localizedDescription ?? defaultErrorMessage)"
  }
}

internal class RemoveFromAlbumException: GenericException<(any Error)?> {
  override var reason: String {
    "Couldn't remove assets from album: \(param?.localizedDescription ?? defaultErrorMessage)"
  }
}

internal class RemoveAssetsException: GenericException<(any Error)?> {
  override var reason: String {
    "Couldn't remove assets: \(param?.localizedDescription ?? defaultErrorMessage)"
  }
}

internal class UnsupportedAssetException: Exception {
  override var reason: String {
    "This file type is not supported yet"
  }
}

internal class NotEnoughPermissionsException: Exception {
  override var reason: String {
    "Access to all photos is required to do this operation"
  }
}

internal class FailedToAddAssetException: GenericException<(any Error)?> {
  override var reason: String {
    "Unable to add asset to the new album: \(param?.localizedDescription ?? defaultErrorMessage)"
  }
}

internal class CreateAlbumFailedException: GenericException<(any Error)?> {
  override var reason: String {
    "Could not create album: \(param?.localizedDescription ?? defaultErrorMessage)"
  }
}

internal class DeleteAlbumFailedException: GenericException<(any Error)?> {
  override var reason: String {
    "Could not delete album: \(param?.localizedDescription ?? defaultErrorMessage)"
  }
}

internal class CursorException: Exception {
  override var reason: String {
    "Couldn't find cursor"
  }
}

internal class SortByKeyException: GenericException<String> {
  override var reason: String {
    "SortBy key \"\(param)\" is not supported"
  }
}

internal class PermissionsModuleNotFoundException: Exception {
  override var reason: String {
    "Permissions module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal class ExportSessionFailedException: Exception {
  override var reason: String {
    "Failed to export the requested video"
  }
}

internal class ExportSessionCancelledException: Exception {
  override var reason: String {
    "Exporting session cancelled"
  }
}

internal class ExportSessionUnknownException: Exception {
  override var reason: String {
    "Could not export the requested video"
  }
}

internal class InvalidPathException: Exception {
  override var reason: String {
    "Failed to create video path"
  }
}
