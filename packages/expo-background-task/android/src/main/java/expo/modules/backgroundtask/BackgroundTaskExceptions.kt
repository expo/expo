package expo.modules.backgroundtask

import expo.modules.kotlin.exception.CodedException

class MissingAppContextException : CodedException(message = "App Context not available.")

class InvalidFinishTaskRun : CodedException(message = "Expo BackgroundTasks: Tried to mark task run as finished when there are no task runs active")