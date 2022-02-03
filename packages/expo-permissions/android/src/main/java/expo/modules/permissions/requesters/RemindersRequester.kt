package expo.modules.permissions.requesters

import android.os.Bundle
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import expo.modules.interfaces.permissions.PermissionsStatus

class RemindersRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      putString(STATUS_KEY, PermissionsStatus.GRANTED.status)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, true)
      putBoolean(GRANTED_KEY, true)
    }
  }
}
