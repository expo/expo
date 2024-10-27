import ExpoModulesCore

internal class InvalidCategoryException: GenericException<String> {
  override var reason: String {
    "`\(param)` is not a valid audio category"
  }
}

internal class AudioStateException: GenericException<String> {
  override var reason: String {
    "Failed to change audio state: \(param)"
  }
}

internal class AudioPermissionsException: Exception {
  override var reason: String {
    "Recording permission has not been granted"
  }
}

internal class InvalidAudioModeException: GenericException<String> {
  override var reason: String {
    "Impossible audio mode: \(param)"
  }
}

internal class RecordingDisabledException: Exception {
  override var reason: String {
    "Recording not allowed on iOS. Enable with Audio.setAudioModeAsync"
  }
}

internal class NoInputFoundException: Exception {
  override var reason: String {
    "No input port found"
  }
}

internal class PreferredInputFoundException: GenericException<String> {
  override var reason: String {
    "Preferred input '\(param)' not found!"
  }
}
