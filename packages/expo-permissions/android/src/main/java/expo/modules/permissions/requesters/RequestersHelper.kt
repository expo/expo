package expo.modules.permissions.requesters

import android.Manifest
import android.os.Bundle
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus

fun parseBasicLocationPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
  return Bundle().apply {
    val accessFineLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_FINE_LOCATION)
    val accessCoarseLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_COARSE_LOCATION)
    val canAskAgain = accessFineLocation.canAskAgain && accessCoarseLocation.canAskAgain
    val isGranted = accessCoarseLocation.status == PermissionsStatus.GRANTED || accessFineLocation.status == PermissionsStatus.GRANTED

    putString(PermissionsResponse.STATUS_KEY, when {
      accessFineLocation.status == PermissionsStatus.GRANTED -> {
        PermissionsStatus.GRANTED.status
      }
      accessCoarseLocation.status == PermissionsStatus.GRANTED -> {
        PermissionsStatus.GRANTED.status
      }
      accessFineLocation.status == PermissionsStatus.DENIED && accessCoarseLocation.status == PermissionsStatus.DENIED -> {
        PermissionsStatus.DENIED.status
      }
      else -> {
        PermissionsStatus.UNDETERMINED.status
      }
    })

    putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
    putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
    putBoolean(PermissionsResponse.GRANTED_KEY, isGranted)
  }
}
