import ExpoModulesCore

internal final class InvalidCategoryException: GenericException<String> {
  override var reason: String {
    "`\(param)` is not a valid audio category"
  }
}

internal final class AudioStateException: GenericException<String> {
  override var reason: String {
    "Failed to change audio state: \(param)"
  }
}

internal final class AudioPermissionsException: Exception {
  override var reason: String {
    "Recording permission has not been granted"
  }
}

internal final class InvalidAudioModeException: GenericException<String> {
  override var reason: String {
    "Impossible audio mode: \(param)"
  }
}

internal final class RecordingDisabledException: Exception {
  override var reason: String {
    "Recording not allowed on iOS. Enable with Audio.setAudioModeAsync"
  }
}

internal final class NoInputFoundException: Exception {
  override var reason: String {
    "No input port found"
  }
}

internal final class PreferredInputFoundException: GenericException<String> {
  override var reason: String {
    "Preferred input '\(param)' not found!"
  }
}

internal final class AudioRecordingException: GenericException<String> {
  override var reason: String {
    "Audio recording error: \(param)"
  }
}
