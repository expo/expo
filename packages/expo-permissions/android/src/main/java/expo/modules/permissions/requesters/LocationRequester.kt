package expo.modules.permissions.requesters

import android.Manifest
import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsResponse.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

class LocationRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
  )

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsStatus>): Bundle {
    return Bundle().apply {
      var scope = "none"
      val accessFineLocation = permissionsResponse[Manifest.permission.ACCESS_FINE_LOCATION]
      val accessCoarseLocation = permissionsResponse[Manifest.permission.ACCESS_COARSE_LOCATION]

      putString(STATUS_KEY, when {
        accessFineLocation == PermissionsStatus.GRANTED -> {
          scope = "fine"
          PermissionsStatus.GRANTED.jsString
        }
        accessCoarseLocation == PermissionsStatus.GRANTED -> {
          scope = "coarse"
          PermissionsStatus.GRANTED.jsString
        }
        accessFineLocation == PermissionsStatus.DENIED && accessCoarseLocation == PermissionsStatus.DENIED -> {
          PermissionsStatus.DENIED.jsString
        }
        else -> {
          PermissionsStatus.UNDETERMINED.jsString
        }
      })
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBundle("android", Bundle().apply { putString("scope", scope) })
    }
  }
}
