package expo.modules.permissions.requesters

import android.Manifest
import android.os.Bundle
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus

class ForegroundLocationRequester : PermissionRequester {
  override fun getAndroidPermissions() = listOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION
  )

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return parseBasicLocationPermissions(permissionsResponse).apply {
      val accessFineLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_FINE_LOCATION)
      val accessCoarseLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_COARSE_LOCATION)

      val accuracy = when {
        accessFineLocation.status == PermissionsStatus.GRANTED -> {
          "fine"
        }
        accessCoarseLocation.status == PermissionsStatus.GRANTED -> {
          "coarse"
        }
        else -> {
          "none"
        }
      }

      putBundle(
        "android",
        Bundle().apply {
          putString("accuracy", accuracy)
        }
      )
    }
  }
}
