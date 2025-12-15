package expo.modules.medialibrary.next.exceptions

import expo.modules.kotlin.exception.CodedException

class PermissionException(message: String, cause: Throwable? = null) : CodedException(message, cause)
