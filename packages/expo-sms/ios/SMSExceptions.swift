import ExpoModulesCore

internal final class SMSUnavailableException: Exception {
  override var reason: String {
    "SMS service is not available"
  }
}

internal final class SMSPendingException: Exception {
  override var reason: String {
    "SMS sending in progress, await the old request and then try again"
  }
}

internal final class SMSSendingException: GenericException<String> {
  override var reason: String {
    param
  }
}

internal final class SMSFileException: GenericException<String> {
  override var reason: String {
    "Failed to attach file: \(param)"
  }
}

internal final class SMSMimeTypeException: GenericException<String> {
  override var reason: String {
    "Failed to find UTI for mimeType: \(param)"
  }
}

internal final class SMSUriException: GenericException<String> {
  override var reason: String {
    "Invalid file uri: \(param)"
  }
}
