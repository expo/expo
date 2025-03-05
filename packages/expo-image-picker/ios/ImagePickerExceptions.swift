// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class PermissionsModuleNotFoundException: Exception {
  override var reason: String {
    "Permissions module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal final class FileSystemModuleNotFoundException: Exception {
  override var reason: String {
    "FileSystem module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal final class LoggerModuleNotFoundException: Exception {
  override var reason: String {
    "Logger module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal final class MissingCameraPermissionException: Exception {
  override var reason: String {
    "Missing camera or camera roll permission"
  }
}

internal final class MissingMicrophonePermissionException: Exception {
  override var reason: String {
    "Missing microphone permission. Please enable it with the `expo-image-picker` config plugin"
  }
}

internal final class MissingPhotoLibraryPermissionException: Exception {
  override var reason: String {
    "Missing photo library permission"
  }
}

internal final class CameraUnavailableOnSimulatorException: Exception {
  override var reason: String {
    "Camera not available on simulator"
  }
}

internal final class MultiselectUnavailableException: Exception {
  override var reason: String {
    "Multiple selection is only available on iOS 14+"
  }
}

internal final class MissingCurrentViewControllerException: Exception {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal final class MaxDurationWhileEditingExceededException: Exception {
  override var reason: String {
    "'videoMaxDuration' limits to 600 when 'allowsEditing=true'"
  }
}

internal final class InvalidMediaTypeException: GenericException<String?> {
  override var reason: String {
    "Cannot handle '\(param ?? "nil")' media type"
  }
}

internal final class FailedToCreateGifException: Exception {
  override var reason: String {
    "Failed to create image destination for GIF export"
  }
}

internal final class FailedToExportGifException: Exception {
  override var reason: String {
    "Failed to export requested GIF"
  }
}

internal final class FailedToWriteImageException: Exception {
  override var reason: String {
    "Failed to write data to a file"
  }
}

internal final class FailedToReadImageException: Exception {
  override var reason: String {
    "Failed to read picked image"
  }
}

internal final class FailedToReadImageDataException: Exception {
  override var reason: String {
    "Failed to read data from a file"
  }
}

internal final class FailedToReadVideoSizeException: Exception {
  override var reason: String {
    "Failed to read the video size"
  }
}

internal final class FailedToReadVideoException: Exception {
  override var reason: String {
    "Failed to read picked video"
  }
}

internal final class FailedToTranscodeVideoException: Exception {
  override var reason: String {
    "Failed to transcode picked video"
  }
}

internal final class UnsupportedVideoExportPresetException: GenericException<String> {
  override var reason: String {
    "Video cannot be transcoded with export preset: \(param)"
  }
}

internal final class FailedToPickVideoException: Exception {
  override var reason: String {
    "Video could not be picked"
  }
}

internal final class FailedToReadImageDataForBase64Exception: Exception {
  override var reason: String {
    "Failed to read image data to perform base64 encoding"
  }
}

internal final class FailedToPickLivePhotoException: Exception {
  override var reason: String {
    "Failed to read the selected item as a live photo"
  }
}
