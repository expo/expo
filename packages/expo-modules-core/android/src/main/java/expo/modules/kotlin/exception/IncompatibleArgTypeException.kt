package expo.modules.kotlin.exception

import kotlin.reflect.KType

class IncompatibleArgTypeException(
  argumentType: KType,
  desiredType: KType,
  cause: Throwable? = null
) : CodedException(
  message = "Type $argumentType of argument is not compatible with expected type $desiredType.",
  cause = cause
)
