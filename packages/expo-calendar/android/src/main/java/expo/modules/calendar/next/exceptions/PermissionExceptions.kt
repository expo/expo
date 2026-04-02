package expo.modules.calendar.next.exceptions

import expo.modules.kotlin.exception.CodedException

class PermissionException(permission: String, cause: Throwable? = null) :
  CodedException("Missing $permission permission", cause)
