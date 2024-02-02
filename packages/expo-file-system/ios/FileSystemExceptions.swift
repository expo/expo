// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class FileNotExistsException: GenericException<String> {
  override var reason: String {
    "File '\(param)' does not exist"
  }
}

final class DirectoryNotExistsException: GenericException<String> {
  override var reason: String {
    "Directory '\(param)' does not exist"
  }
}

final class FileNotReadableException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not readable"
  }
}

final class FileNotWritableException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not writable"
  }
}

final class FileWriteFailedException: GenericException<String> {
  override var reason: String {
    "Writing to '\(param)' file has failed"
  }
}

final class FileCannotDeleteException: GenericException<String> {
  override var reason: String {
    "File '\(param)' could not be deleted"
  }
}

final class InvalidFileUrlException: GenericException<URL> {
  override var reason: String {
    "'\(param.absoluteString)' is not a file URL"
  }
}

final class UnsupportedSchemeException: GenericException<String?> {
  override var reason: String {
    "Unsupported URI scheme: '\(String(describing: param))'"
  }
}

final class HeaderEncodingFailedException: GenericException<String> {
  override var reason: String {
    "Unable to encode headers for request '\(param)' to UTF8"
  }
}

final class DownloadTaskNotFoundException: GenericException<String> {
  override var reason: String {
    "Cannot find a download task with id: '\(param)'"
  }
}

final class CannotDetermineDiskCapacity: Exception {
  override var reason: String {
    "Unable to determine free disk storage capacity"
  }
}

final class FailedToCreateBodyException: Exception {
  override var reason: String {
    "Unable to create multipart body"
  }
}

final class FailedToAccessDirectoryException: Exception {
  override var reason: String {
    "Failed to access `Caches` directory"
  }
}
