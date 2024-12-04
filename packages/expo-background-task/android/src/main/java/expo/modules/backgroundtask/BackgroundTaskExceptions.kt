package expo.modules.backgroundtask

import expo.modules.kotlin.exception.CodedException

class MissingTaskException : CodedException(message = "Task not found")

class MissingContextException : CodedException(message = "Application context not found")

class MissingTaskServiceException : CodedException(message = "TaskService not available.")

class MissingAppScopeKey : CodedException(message = "Could not find required appScopeKey in worker.")

class InvalidBackgroundTaskConsumer : CodedException(message = "Invalid background task consumer")

class TaskMangerInterfaceNotFoundException : CodedException(message = "TaskManagerInterface not found")
