package expo.modules.backgroundtask

import expo.modules.kotlin.exception.CodedException

class MissingTaskException : CodedException(message = "No task found")

class MissingTaskServiceException : CodedException(message = "TaskService not available.")

class MissingAppScopeKey : CodedException(message = "Could not find required appScopeKey in worker.")

class InvalidBackgroundTaskConsumer : CodedException(message = "Invalid background task consumer")