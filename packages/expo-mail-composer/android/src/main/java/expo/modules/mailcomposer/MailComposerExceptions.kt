package expo.modules.mailcomposer

import expo.modules.kotlin.exception.CodedException

internal class ResolveActivityException(cause: Throwable? = null) :
  CodedException("Could not check if mail can be opened", cause)
