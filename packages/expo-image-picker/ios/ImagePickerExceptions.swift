// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal class PermissionsModuleNotFoundException: Exception {
  override var reason: String {
    "Permissions module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal class FileSystemModuleNotFoundException: Exception {
  override var reason: String {
    "FileSystem module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal class LoggerModuleNotFoundException: Exception {
  override var reason: String {
    "Logger module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal class MissingCameraPermissionException: Exception {
  override var reason: String {
    "Missing camera or camera roll permission"
  }
}

internal class MissingMicrophonePermissionException: Exception {
  override var reason: String {
    "Missing microphone permission. Please enable it with the `expo-image-picker` config plugin"
  }
}

internal class MissingPhotoLibraryPermissionException: Exception {
  override var reason: String {
    "Missing photo library permission"
  }
}

internal class CameraUnavailableOnSimulatorException: Exception {
  override var reason: String {
    "Camera not available on simulator"
  }
}

internal class MultiselectUnavailableException: Exception {
  override var reason: String {
    "Multiple selection is only available on iOS 14+"
  }
}

internal class MissingCurrentViewControllerException: Exception {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal class MaxDurationWhileEditingExceededException: Exception {
  override var reason: String {
    "'videoMaxDuration' limits to 600 when 'allowsEditing=true'"
  }
}

internal class InvalidMediaTypeException: GenericException<String?> {
  override var reason: String {
    "Cannot handle '\(param ?? "nil")' media type"
  }
}

internal class FailedToCreateGifException: Exception {
  override var reason: String {
    "Failed to create image destination for GIF export"
  }
}

internal class FailedToExportGifException: Exception {
  override var reason: String {
    "Failed to export requested GIF"
  }
}

internal class FailedToWriteImageException: Exception {
  override var reason: String {
    "Failed to write data to a file"
  }
}

internal class FailedToReadImageException: Exception {
  override var reason: String {
    "Failed to read picked image"
  }
}

internal class FailedToReadImageDataException: Exception {
  override var reason: String {
    "Failed to read data from a file"
  }
}

internal class FailedToReadVideoSizeException: Exception {
  override var reason: String {
    "Failed to read the video size"
  }
}

internal class FailedToReadVideoException: Exception {
  override var reason: String {
    "Failed to read picked video"
  }
}

internal class FailedToTranscodeVideoException: Exception {
  override var reason: String {
    "Failed to transcode picked video"
  }
}

internal class UnsupportedVideoExportPresetException: GenericException<String> {
  override var reason: String {
    "Video cannot be transcoded with export preset: \(param)"
  }
}

internal class FailedToPickVideoException: Exception {
  override var reason: String {
    "Video could not be picked"
  }
}

internal class FailedToReadImageDataForBase64Exception: Exception {
  override var reason: String {
    "Failed to read image data to perform base64 encoding"
  }
}

internal class FailedToPickLivePhotoException: Exception {
  override var reason: String {
    "Failed to read the selected item as a live photo"
  }
}
