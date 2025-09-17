package expo.modules.medialibrary.next.exceptions

import expo.modules.kotlin.exception.CodedException

class QueryCouldNotBeExecuted(message: String, cause: Throwable? = null) :
  CodedException("Could not execute a query $message", cause)
