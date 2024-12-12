package expo.modules.backgroundtask

import expo.modules.kotlin.exception.CodedException

class MissingContextException : CodedException(message = "Application context not found")

class MissingTaskServiceException : CodedException(message = "TaskService not available.")

class MissingAppScopeKey : CodedException(message = "Could not find required appScopeKey in worker.")

class TaskMangerInterfaceNotFoundException : CodedException(message = "TaskManagerInterface not found")

class TestMethodNotAvailableInProductionBuild : CodedException(message = "Background tasks cannot be triggered in production builds")
