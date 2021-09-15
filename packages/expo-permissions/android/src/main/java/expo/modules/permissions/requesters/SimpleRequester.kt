package expo.modules.permissions.requesters

import android.os.Bundle
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import expo.modules.interfaces.permissions.PermissionsStatus

/**
 * Used for representing CAMERA, CONTACTS, AUDIO_RECORDING, SMS
 */
class SimpleRequester(vararg val permission: String) : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = permission.toList()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      // combined status is equal:
      // granted when all needed permissions have been granted
      // denied when all needed permissions have been denied
      // undetermined if exist permission with undetermined status
      val permissionsStatus = when {
        getAndroidPermissions().all { permissionsResponse.getValue(it).status == PermissionsStatus.GRANTED } -> PermissionsStatus.GRANTED
        getAndroidPermissions().all { permissionsResponse.getValue(it).status == PermissionsStatus.DENIED } -> PermissionsStatus.DENIED
        else -> PermissionsStatus.UNDETERMINED
      }

      putString(STATUS_KEY, permissionsStatus.status)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, getAndroidPermissions().all { permissionsResponse.getValue(it).canAskAgain })
      putBoolean(GRANTED_KEY, permissionsStatus == PermissionsStatus.GRANTED)
    }
  }
}
