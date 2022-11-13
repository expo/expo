import ExpoModulesCore

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

internal class SMSAttachmentException: GenericException<String> {
  override var reason: String {
    param
  }
}
