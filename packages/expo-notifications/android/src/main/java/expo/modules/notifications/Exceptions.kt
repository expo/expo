package expo.modules.notifications

import expo.modules.kotlin.exception.CodedException
import kotlin.reflect.KClass

class ModuleNotFoundException(moduleClass: KClass<*>) :
  CodedException(message = "$moduleClass module not found")

class NotificationWasAlreadyHandledException(val id: String) : CodedException("Failed to handle notification $id, it has already been handled.")

class ExactAlarmPermissionNotDeclaredException :
  CodedException(
    "Cannot request the exact alarm permission because the app does not declare android.permission.SCHEDULE_EXACT_ALARM. " +
      "Add it to `android.permissions` in your app config and rebuild the app."
  )
