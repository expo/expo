package expo.modules.permissions.requesters

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus

class BackgroundLocationRequester : PermissionRequester {
  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>) = when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> parseAndroidPermissionsForAndroidR(permissionsResponse)
    Build.VERSION.SDK_INT == Build.VERSION_CODES.Q -> parseAndroidPermissionsForAndroidQ(permissionsResponse)
    else -> parseAndroidPermissionsForLegacyAndroids(permissionsResponse)
  }

  override fun getAndroidPermissions(): List<String> {
    return when {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> {
        listOf(
          Manifest.permission.ACCESS_BACKGROUND_LOCATION
        )
      }
      Build.VERSION.SDK_INT == Build.VERSION_CODES.Q -> {
        listOf(
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION,
          Manifest.permission.ACCESS_BACKGROUND_LOCATION
        )
      }
      else -> {
        listOf(
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION
        )
      }
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun parseAndroidPermissionsForAndroidR(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      val backgroundLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      val permissionsStatus = backgroundLocation.status

      putString(PermissionsResponse.STATUS_KEY, permissionsStatus.status)

      putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
      putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, backgroundLocation.canAskAgain)
      putBoolean(PermissionsResponse.GRANTED_KEY, permissionsStatus == PermissionsStatus.GRANTED)
    }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun parseAndroidPermissionsForAndroidQ(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      val accessFineLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_FINE_LOCATION)
      val accessCoarseLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_COARSE_LOCATION)
      val accessBackgroundLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_BACKGROUND_LOCATION)

      val canAskAgain = accessFineLocation.canAskAgain && accessCoarseLocation.canAskAgain && accessBackgroundLocation.canAskAgain

      val statuses = listOf(accessFineLocation.status, accessCoarseLocation.status, accessBackgroundLocation.status)

      val status = when {
        statuses.all { it == PermissionsStatus.GRANTED } -> {
          PermissionsStatus.GRANTED
        }
        statuses.all { it == PermissionsStatus.DENIED } -> {
          PermissionsStatus.DENIED
        }
        else -> {
          PermissionsStatus.UNDETERMINED
        }
      }

      val isGranted = status == PermissionsStatus.GRANTED

      putString(PermissionsResponse.STATUS_KEY, status.status)
      putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
      putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
      putBoolean(PermissionsResponse.GRANTED_KEY, isGranted)
    }
  }

  private fun parseAndroidPermissionsForLegacyAndroids(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return parseBasicLocationPermissions(permissionsResponse)
  }
}
