package expo.modules.kotlin.exception

import kotlin.reflect.KType

class NullArgumentException(desiredType: KType) :
  CodedException(message = "Cannot assigned null to not nullable type $desiredType")
