package expo.modules.permissions.requesters

import android.Manifest
import android.os.Build
import android.os.Bundle
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_ALWAYS
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_IN_USE
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.SCOPE_NONE
import expo.modules.interfaces.permissions.PermissionsStatus

class LegacyLocationRequester(private val includeBackgroundPermission: Boolean = false) : PermissionRequester {
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

      val scope =
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

      putString(SCOPE_KEY, scope)
      putBundle(
        "android",
        Bundle().apply {
          putString("accuracy", accuracy)
        }
      )
    }
  }
}
