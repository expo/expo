import ExpoModulesCore

internal class SmsUnavailableException: Exception {
  override var reason: String {
    "SMS service is not available"
  }
}

internal class SmsPendingException: Exception {
  override var reason: String {
    "SMS sending in progress, await the old request and then try again"
  }
}
