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
      putString(STATUS_KEY, when {
        permissionsService.isPermissionGranted(permission) -> {
          GRANTED_VALUE
        }
        permissionsService.didAsk(permission) -> {
          GRANTED_VALUE
        }
        else -> {
          UNDETERMINED_VALUE
        }
      })
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}
