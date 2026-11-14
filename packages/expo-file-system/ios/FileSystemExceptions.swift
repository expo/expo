import Foundation
import ExpoModulesCore

internal final class CopyOrMoveDirectoryToFileException: Exception {
  override var reason: String {
    "Unable to copy or move a directory to a file"
  }
}

internal final class UnableToDownloadException: GenericException<String> {
  override var reason: String {
    "Unable to download a file: \(param)"
  }
}

internal extension Error {
  /// `localizedDescription` followed by the error's `[domain:code]` and, when present, the
  /// underlying error's. The description is translated to the device language; the domain and
  /// code are not, so JS can tell errors apart without matching the text.
  var localizedDescriptionWithCode: String {
    let nsError = self as NSError
    var description = "\(localizedDescription) [\(nsError.domain):\(nsError.code)]"
    if let underlying = nsError.userInfo[NSUnderlyingErrorKey] as? NSError {
      description += " [\(underlying.domain):\(underlying.code)]"
    }
    return description
  }
}

internal final class UnableToWriteBase64DataException: GenericException<String> {
  override var reason: String {
    "Unable to write base64 data to a file: \(param)"
  }
}

internal final class InvalidTypeFileException: Exception {
  override var reason: String {
    "A folder with the same name already exists in the file location"
  }
}

internal final class InvalidTypeDirectoryException: Exception {
  override var reason: String {
    "A file with the same name already exists in the directory location"
  }
}

internal final class UnableToGetFileAttribute: GenericException<String> {
  override var reason: String {
    "Unable to get file attribute: \(param)"
  }
}

internal final class UnableToGetSizeException: GenericException<String> {
  override var reason: String {
    "Unable to get file or directory size: \(param)"
  }
}

internal final class UnableToDeleteException: GenericException<String> {
  override var reason: String {
    "Unable to delete file or directory: \(param)"
  }
}

internal final class UnableToCreateException: GenericException<String> {
  override var reason: String {
    "Unable to create file or directory: \(param)"
  }
}

internal final class UnableToReadHandleException: GenericException<String> {
  override var reason: String {
    "Unable to read from a file handle: \(param)"
  }
}

internal final class UnableToWriteHandleException: GenericException<String> {
  override var reason: String {
    "Unable to write to a file handle: \(param)"
  }
}

internal final class UnableToGetInfoException: GenericException<String> {
  override var reason: String {
    "Unable to get info from a file: \(param)"
  }
}

internal final class DestinationAlreadyExistsException: Exception {
  override var reason: String {
    "Destination already exists"
  }
}

internal final class MissingPermissionException: GenericException<String> {
  override var reason: String {
    "Missing permission for uri: \(param)"
  }
}

internal final class PickingInProgressException: Exception {
  override var reason: String {
    "File picking is already in progress"
  }
}

internal final class MissingViewControllerException: Exception {
  override var reason: String {
    "No view controller available for presenting file picker"
  }
}

internal final class FilePickingCancelledException: Exception {
  override var reason: String {
    "File picking was cancelled by the user"
  }
}

internal final class NotImplementedException: Exception {
  override var reason: String {
    "Not implemented"
  }
}

internal final class FeatureNotAvailableOnPlatformException: Exception {
  override var reason: String {
    "This feature is not available on this platform"
  }
}

internal final class UnableToUploadException: GenericException<String> {
  override var reason: String {
    "Unable to upload a file: \(param)"
  }
}

internal final class InvalidUrlException: GenericException<String> {
  override var reason: String {
    "Invalid URL: \(param)"
  }
}

internal final class InvalidResumeDataException: Exception {
  override var reason: String {
    "Invalid resume data provided"
  }
}

internal final class DownloadCancelledException: Exception {
  override var reason: String {
    "Download was cancelled"
  }
}

internal final class UploadCancelledException: Exception {
  override var reason: String {
    "Upload was cancelled"
  }
}

internal final class UploadFailedToCreateBodyException: Exception {
  override var reason: String {
    "Failed to create multipart body"
  }
}

internal final class UploadFailedToAccessCacheException: Exception {
  override var reason: String {
    "Failed to access cache directory for upload temp file"
  }
}

internal final class WatcherSetupException: GenericException<String> {
  override var reason: String {
    "Cannot start watching path '\(param)'"
  }
}

internal final class WatcherPermissionException: GenericException<String> {
  override var reason: String {
    "No permission to watch path '\(param)'"
  }
}

internal final class WatcherPathNotFoundException: GenericException<String> {
  override var reason: String {
    "Path does not exist: '\(param)'"
  }
}

internal final class WatcherUnsupportedPathException: GenericException<String> {
  override var reason: String {
    "Cannot watch path '\(param)'. Only local file:// paths are supported."
  }
}

internal final class FilePreviewInProgressException: Exception, @unchecked Sendable {
  override var reason: String {
    "File preview is already in progress"
  }
}

internal final class FilePreviewMissingViewControllerException: Exception, @unchecked Sendable {
  override var reason: String {
    "No view controller available for presenting file preview"
  }
}

internal final class FilePreviewUnsupportedException: GenericException<URL>, @unchecked Sendable {
  override var reason: String {
    "The file cannot be previewed: \(param.absoluteString)"
  }
}

internal final class FilePreviewFileNotFoundException: GenericException<URL>, @unchecked Sendable {
  override var reason: String {
    "File does not exist: \(param.absoluteString)"
  }
}

internal final class FilePreviewInvalidInputException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    param
  }
}

internal final class FilePreviewPresentationException: Exception, @unchecked Sendable {
  override var reason: String {
    "Unable to present file preview"
  }
}

internal final class BackgroundDownloadNotFinishedException: Exception {
  override var reason: String {
    "Background completion can only be acknowledged after the download finishes"
  }
}
