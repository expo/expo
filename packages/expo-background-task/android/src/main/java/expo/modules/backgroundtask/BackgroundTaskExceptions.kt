package expo.modules.backgroundtask

import expo.modules.kotlin.exception.CodedException

internal class MissingContextException : CodedException(message = "Application context not found")

internal class MissingTaskServiceException : CodedException(message = "TaskService not available.")

internal class MissingAppScopeKey : CodedException(message = "Could not find required appScopeKey in worker.")

internal class TaskMangerInterfaceNotFoundException : CodedException(message = "TaskManagerInterface not found")

internal class TestMethodNotAvailableInProductionBuild : CodedException(message = "Background tasks cannot be triggered in production builds")
