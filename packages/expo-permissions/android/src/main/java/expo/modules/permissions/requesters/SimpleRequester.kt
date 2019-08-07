package expo.modules.permissions.requesters

import android.os.Bundle
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.PERMISSION_EXPIRES_NEVER
import expo.modules.permissions.PermissionsService
import expo.modules.permissions.STATUS_KEY
import expo.modules.permissions.UNDETERMINED_VALUE

/**
 * Used for representing CAMERA, CONTACTS, AUDIO_RECORDING, SMS
 *
 */
class SimpleRequester(private val permissionsService: PermissionsService, private val permission: String) : PermissionRequester {
  override fun getPermissionToAsk(): Array<String> = arrayOf(permission)

  override fun getPermission(): Bundle {
    return Bundle().apply {
      try {
        when {
          permissionsService.isPermissionGranted(permission) -> {
            putString(STATUS_KEY, GRANTED_VALUE)
          }
          permissionsService.didAsk(permission) -> {
            putString(STATUS_KEY, GRANTED_VALUE)
          }
          else -> {
            putString(STATUS_KEY, UNDETERMINED_VALUE)
          }
        }
      } catch (e: IllegalStateException) {
        putString(STATUS_KEY, UNDETERMINED_VALUE)
      }
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}
