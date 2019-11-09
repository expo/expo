package expo.modules.permissions.requesters

import android.Manifest
import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

class LocationRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
  )

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      var scope = "none"
      val accessFineLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_FINE_LOCATION)
      val accessCoarseLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_COARSE_LOCATION)
      val canAskAgain = accessCoarseLocation.canAskAgain && accessCoarseLocation.canAskAgain
      val isGranted = accessCoarseLocation.status == PermissionsStatus.GRANTED || accessFineLocation.status == PermissionsStatus.GRANTED;

      putString(STATUS_KEY, when {
        accessFineLocation.status == PermissionsStatus.GRANTED -> {
          scope = "fine"
          PermissionsStatus.GRANTED.status
        }
        accessCoarseLocation.status == PermissionsStatus.GRANTED -> {
          scope = "coarse"
          PermissionsStatus.GRANTED.status
        }
        accessFineLocation.status == PermissionsStatus.DENIED && accessCoarseLocation.status == PermissionsStatus.DENIED -> {
          PermissionsStatus.DENIED.status
        }
        else -> {
          PermissionsStatus.UNDETERMINED.status
        }
      })
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, canAskAgain)
      putBoolean(GRANTED_KEY, isGranted)
      putBundle("android", Bundle().apply { putString("scope", scope) })
    }
  }
}
