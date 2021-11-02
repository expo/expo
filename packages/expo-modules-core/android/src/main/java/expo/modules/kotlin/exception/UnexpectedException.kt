package expo.modules.kotlin.exception

class UnexpectedException(val throwable: Throwable)
  : CodedException(throwable)
