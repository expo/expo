package expo.modules.sensors

import expo.modules.kotlin.exception.CodedException

class NotSupportedException(message: String) : CodedException(message)

class TaskCancelledException : CodedException(
  "TASK_CANCELLED",
  "Google Play services cancelled the pedometer Recording API request. Try again.",
  null
)

class TaskTimeoutException : CodedException(
  "TASK_TIMEOUT",
  "Google Play services did not respond to the pedometer Recording API request within $TaskTimeoutSeconds seconds. " +
    "Check that Google Play services is up to date on the device, then try again.",
  null
)

class TaskFailedException(cause: Throwable?) : CodedException(
  "TASK_FAILED",
  "The pedometer Recording API request to Google Play services failed.",
  cause
)

class ReadDataFailedException(statusCode: Int, statusMessage: String?) : CodedException(
  "READ_DATA_FAILED",
  "Failed to read data from the Recording API. Code: $statusCode. Message: $statusMessage",
  null
)

class PlayServicesNotLinkedException : CodedException(
  "ERR_PEDOMETER_PLAY_SERVICES_NOT_LINKED",
  "Pedometer step history is not available because the app does not include the Google Play services " +
    "libraries for the pedometer. Set `pedometerPlayServicesEnabled` to `true` in the `expo-sensors` config plugin, " +
    "or set `expo.sensors.pedometer-play-services-enabled=true` in `android/gradle.properties`. Then rebuild the app.",
  null
)

class PermissionsModuleNotFoundException : CodedException(
  "ERR_NO_PERMISSIONS",
  "Permissions module is null. Are you sure all the installed Expo modules are properly linked?",
  null
)
