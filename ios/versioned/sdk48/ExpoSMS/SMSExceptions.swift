import ABI48_0_0ExpoModulesCore

internal class SMSUnavailableException: Exception {
  override var reason: String {
    "SMS service is not available"
  }
}

internal class SMSPendingException: Exception {
  override var reason: String {
    "SMS sending in progress, await the old request and then try again"
  }
}

internal class SMSSendingException: GenericException<String> {
  override var reason: String {
    param
  }
}

internal class SMSFileException: GenericException<String> {
  override var reason: String {
    "Failed to attach file: \(param)"
  }
}

internal class SMSMimeTypeException: GenericException<String> {
  override var reason: String {
    "Failed to find UTI for mimeType: \(param)"
  }
}

internal class SMSUriException: GenericException<String> {
  override var reason: String {
    "Invalid file uri: \(param)"
  }
}
