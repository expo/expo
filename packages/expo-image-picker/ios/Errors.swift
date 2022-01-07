// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct PermissionsModuleNotFoundError: CodedError {
  var description: String {
    "Permissions module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal struct MissingCameraPermissionError: CodedError {
  var description: String {
    "Missing camera or camera roll permission."
  }
}

internal struct CameraUnavailableOnSimulatorError: CodedError {
  var description: String {
    "Camera not available on simulator."
  }
}

internal struct MissingCurrentViewController: CodedError {
  var description: String {
    "Cannot determine currently preseted view controller."
  }
}

internal struct MaxDurationWhileEditingExceededError: CodedError {
  var description: String {
    "'videoMaxDuration' limits to 600 when 'allowsEditing=true'."
  }
}

internal struct MissingFileSystemMmoduleError: CodedError {
  var description: String {
    "No FileSystem module."
  }
}

internal struct MissingLoggerModuleError: CodedError {
  var description: String {
    "No Logger module."
  }
}

internal struct UnhandledMediaTypeError: CodedError {
  let mediaType: String?
  var description: String {
    "Cannot handle \"\(mediaType ?? "nil")\" media type."
  }
}

internal struct FailedToCreateGifError: CodedError {
  var description: String {
    "Failed to create image destination for GIF export."
  }
}

internal struct FailedToExportGifError: CodedError {
  var description: String {
    "Failed to export requested GIF."
  }
}

internal struct FailedToWriteImageError: CodedError {
  let reason: Error
  var description: String {
    "Failed to write data to a file: \(reason)"
  }
}

internal struct FailedToReadImageDataError: CodedError {
  let reason: Error
  var description: String {
    "Failed to read data from a file: \(reason)"
  }
}

internal struct FailedToOpenVideoError: CodedError {
  var description: String {
    "Couldn't open video."
  }
}

internal struct FailedToPickVideo: CodedError {
  let reason: Error
  var description: String {
    "Video could not be picked \(reason)"
  }
}

internal struct FailedToReadVideoSize: CodedError {
  var description: String {
    "Failed to read the video size."
  }
}

internal struct FailedToReadImageDataForBase64Error: CodedError {
  var description: String {
    "Failed to read image data to perform base64 encoding."
  }
}

internal struct UnexpectedError: CodedError {
  public let description: String
  init(_ error: Error) {
    self.description = error.localizedDescription
  }
}
