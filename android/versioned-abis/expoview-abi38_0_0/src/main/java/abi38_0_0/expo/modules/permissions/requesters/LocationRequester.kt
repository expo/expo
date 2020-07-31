package abi38_0_0.expo.modules.permissions.requesters

import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.FOREGROUND_GRANTED_KEY
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.FOREGROUND_STATUS_KEY
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import abi38_0_0.org.unimodules.interfaces.permissions.PermissionsStatus
import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi

class LocationRequester : PermissionRequester {

  private val delegate: PermissionRequester = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    API29LocationRequester()
  } else {
    PreAPI29LocationRequester()
  }


  override fun getAndroidPermissions(): List<String> =
    delegate.getAndroidPermissions()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>) = delegate.parseAndroidPermissions(permissionsResponse)

}

class PreAPI29LocationRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION)

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

@RequiresApi(Build.VERSION_CODES.Q)
class API29LocationRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf(
    Manifest.permission.ACCESS_BACKGROUND_LOCATION,
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION)

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      val accessFineLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_FINE_LOCATION)
      val accessCoarseLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_COARSE_LOCATION)
      val accessBackgroundLocation = permissionsResponse.getValue(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      val canAskAgain = accessCoarseLocation.canAskAgain && accessCoarseLocation.canAskAgain && accessBackgroundLocation.canAskAgain
      val coarseGranted = accessCoarseLocation.status == PermissionsStatus.GRANTED
      val fineGranted = accessFineLocation.status == PermissionsStatus.GRANTED
      val backgroundGranted = accessBackgroundLocation.status == PermissionsStatus.GRANTED

      val scope: String = when {
        backgroundGranted && fineGranted -> {
          "fine"
        }
        backgroundGranted && coarseGranted -> {
          "coarse"
        }
        else -> {
          "none"
        }
      }

      val foregroundScope: String = when {
        fineGranted -> {
          "fine"
        }
        coarseGranted -> {
          "coarse"
        }
        else -> {
          "none"
        }
      }

      val isForegroundGranted = fineGranted || coarseGranted
      val isGranted = backgroundGranted && isForegroundGranted

      val foregroundStatus: PermissionsStatus = when {
        fineGranted -> {
          PermissionsStatus.GRANTED
        }
        coarseGranted -> {
          PermissionsStatus.GRANTED
        }
        accessFineLocation.status == PermissionsStatus.DENIED && accessCoarseLocation.status == PermissionsStatus.DENIED -> {
          PermissionsStatus.DENIED
        }
        else -> {
          PermissionsStatus.UNDETERMINED
        }
      }
      val status: PermissionsStatus = when {
        foregroundStatus == PermissionsStatus.GRANTED && accessBackgroundLocation.status == PermissionsStatus.GRANTED -> {
          PermissionsStatus.GRANTED
        }
        accessBackgroundLocation.status == PermissionsStatus.DENIED -> {
          PermissionsStatus.DENIED
        }
        else -> {
          PermissionsStatus.UNDETERMINED
        }
      }

      putString(FOREGROUND_STATUS_KEY, foregroundStatus.status)
      putString(STATUS_KEY, status.status)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, canAskAgain)
      putBoolean(GRANTED_KEY, isGranted)
      putBoolean(FOREGROUND_GRANTED_KEY, isForegroundGranted)
      putBundle("android", Bundle().apply {
        if (isGranted) {
          putString("scope", scope)
        } else {
          putString("scope", "none")
        }
        putString("foregroundScope", foregroundScope)
      })
    }
  }

}
