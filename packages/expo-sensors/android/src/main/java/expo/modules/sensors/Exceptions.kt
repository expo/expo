package expo.modules.sensors

import expo.modules.kotlin.exception.CodedException

class NotSupportedException(message: String) : CodedException(message)

class TaskCancelledException(operationName: String) : CodedException(
  "TASK_CANCELLED",
  "The pedometer operation was cancelled while attempting to $operationName.",
  null
)

class TaskTimeoutException(operationName: String) : CodedException(
  "TASK_TIMEOUT",
  "Google Play services did not respond within $TaskTimeoutSeconds seconds while attempting to $operationName. " +
    "Check that Google Play services is up to date on the device, then try again.",
  null
)

class TaskFailedException(operationName: String, cause: Throwable) : CodedException(
  "TASK_FAILED",
  "The pedometer operation failed while attempting to $operationName.",
  cause
)

class ReadDataFailedException(statusCode: Int, statusMessage: String?) : CodedException(
  "READ_DATA_FAILED",
  "Failed to read data from the Recording API. Code: $statusCode. Message: $statusMessage",
  null
)
