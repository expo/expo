package expo.modules.permissions.requesters

import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsResponse.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

/**
 * Used for representing CAMERA, CONTACTS, AUDIO_RECORDING, SMS
 */
class SimpleRequester(vararg val permission: String) : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = permission.toList()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsStatus>): Bundle {
    return Bundle().apply {
      // combined status is equal:
      // granted when all needed permissions have been granted
      // denied when all needed permissions have been denied
      // undetermined if exist permission with undetermined status
      putString(STATUS_KEY, when {
        getAndroidPermissions().all { permissionsResponse[it] == PermissionsStatus.GRANTED } -> PermissionsStatus.GRANTED.jsString
        getAndroidPermissions().all { permissionsResponse[it] == PermissionsStatus.DENIED } -> PermissionsStatus.DENIED.jsString
        else -> PermissionsStatus.UNDETERMINED.jsString
      })
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}
