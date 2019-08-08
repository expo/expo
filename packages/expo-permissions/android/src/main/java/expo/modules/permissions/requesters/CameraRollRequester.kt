package expo.modules.permissions.requesters

import android.Manifest
import android.os.Bundle
import expo.modules.permissions.PermissionsTypes.CAMERA
import expo.modules.permissions.DENIED_VALUE
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.PERMISSION_EXPIRES_NEVER
import expo.modules.permissions.PermissionsService
import expo.modules.permissions.STATUS_KEY
import expo.modules.permissions.UNDETERMINED_VALUE

class CameraRollRequester(private val permissionsService: PermissionsService) : PermissionRequester {
  override fun getPermissionToAsk(): Array<String> = arrayOf(
      Manifest.permission.READ_EXTERNAL_STORAGE,
      Manifest.permission.WRITE_EXTERNAL_STORAGE
  )

  override fun getPermission(): Bundle {
    return Bundle().apply {
      putString(STATUS_KEY, when {
        permissionsService.arePermissionsGranted(getPermissionToAsk()) -> {
          GRANTED_VALUE
        }
        permissionsService.didAsk(CAMERA.type) -> {
          DENIED_VALUE
        }
        else -> {
          UNDETERMINED_VALUE
        }
      })
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}
