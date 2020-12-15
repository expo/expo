package expo.modules.permissions.requesters

import android.Manifest
import android.os.Build
import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_ALWAYS
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_IN_USE
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_NONE
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

class LocationRequester(val includeBackgroundPermission: Boolean = false) : PermissionRequester {
  override fun getAndroidPermissions(): List<String> {
    val list = mutableListOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )
    if (includeBackgroundPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      list.add(0, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }
    return list
  }

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      var accuracy = "none"
      val scope: String
      val accessFineLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_FINE_LOCATION)
      val accessCoarseLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_COARSE_LOCATION)
      val canAskAgain = accessCoarseLocation.canAskAgain && accessCoarseLocation.canAskAgain
      val isGranted = accessCoarseLocation.status == PermissionsStatus.GRANTED || accessFineLocation.status == PermissionsStatus.GRANTED;

      putString(STATUS_KEY, when {
        accessFineLocation.status == PermissionsStatus.GRANTED -> {
          accuracy = "fine"
          PermissionsStatus.GRANTED.status
        }
        accessCoarseLocation.status == PermissionsStatus.GRANTED -> {
          accuracy = "coarse"
          PermissionsStatus.GRANTED.status
        }
        accessFineLocation.status == PermissionsStatus.DENIED && accessCoarseLocation.status == PermissionsStatus.DENIED -> {
          PermissionsStatus.DENIED.status
        }
        else -> {
          PermissionsStatus.UNDETERMINED.status
        }
      })
      scope =
        if (includeBackgroundPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          val accessBackgroundLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
          if (accessBackgroundLocation.status == PermissionsStatus.GRANTED) {
            SCOPE_ALWAYS
          } else {
            SCOPE_IN_USE
          }
        } else if (accessCoarseLocation.status == PermissionsStatus.GRANTED || accessFineLocation.status == PermissionsStatus.GRANTED) {
          SCOPE_ALWAYS
        } else {
          SCOPE_NONE
        }
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, canAskAgain)
      putBoolean(GRANTED_KEY, isGranted)
      putString(SCOPE_KEY, scope)
      putBundle("android", Bundle().apply {
        putString("accuracy", accuracy)
      })
    }
  }
}
