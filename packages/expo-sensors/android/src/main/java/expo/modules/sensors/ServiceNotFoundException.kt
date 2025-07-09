package expo.modules.sensors

import expo.modules.kotlin.exception.CodedException
import kotlin.reflect.KClass

class ServiceNotFoundException(type: KClass<*>) : CodedException(message = "$type not found")
