package expo.modules.notifications

import expo.modules.kotlin.exception.CodedException
import kotlin.reflect.KClass

class ModuleNotFoundException(moduleClass: KClass<*>) :
  CodedException(message = "$moduleClass module not found")

class NotificationWasAlreadyHandledException(val id: String) : CodedException("Failed to handle notification $id, it has already been handled.")

fun expo.modules.kotlin.Promise.toLegacyPromise(): expo.modules.core.Promise {
  val newPromise = this
  return object : expo.modules.core.Promise {
    override fun resolve(value: Any?) {
      newPromise.resolve(value)
    }

    override fun reject(c: String?, m: String?, e: Throwable?) {
      newPromise.reject(c ?: "unknown", m, e)
    }
  }
}
