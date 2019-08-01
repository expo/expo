package expo.modules.permissions.requesters

import android.content.pm.PackageManager
import android.os.Bundle
import expo.modules.permissions.*
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.STATUS_KEY
import expo.modules.permissions.UNDETERMINED_VALUE


interface PermissionRequester {

  companion object {
    /**
     * Checks status for Android built-in permission
     *
     * @param permission [android.Manifest.permission]
     */
    fun isPermissionGranted(permission: String): Boolean {
      return PermissionsModule.getPermissionService().getPermission(permission) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Checks whether all given permissions are granted or not.
     * Throws IllegalStateException there's no Permissions module present.
     */
    fun arePermissionsGranted(permissions: Array<String>): Boolean {
      val permissionsResult = PermissionsModule.getPermissionService().getPermissions(permissions)
      return permissionsResult.count { it == PackageManager.PERMISSION_GRANTED } == permissions.size
    }

    fun getSimplePermission(permission: String): Bundle {
      return Bundle().apply {
        try {
          when {
            isPermissionGranted(permission) -> {
              putString(STATUS_KEY, GRANTED_VALUE)
            }
            PermissionsModule.didAsk(permission) -> {
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

  fun getPermission(): Bundle

  fun getPermissionToAsk(): Array<String>
}