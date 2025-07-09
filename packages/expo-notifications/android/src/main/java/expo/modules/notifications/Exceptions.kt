package expo.modules.notifications

import expo.modules.kotlin.exception.CodedException
import kotlin.reflect.KClass

class ModuleNotFoundException(moduleClass: KClass<*>) :
  CodedException(message = "$moduleClass module not found")

class NotificationWasAlreadyHandledException(val id: String) : CodedException("Failed to handle notification $id, it has already been handled.")
