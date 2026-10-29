package expo.modules.sensors

import android.Manifest
import android.os.Build
import android.os.Bundle
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.exception.CodedException
import expo.modules.v2.legacyAppContext
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.async.Promise

@Record
internal data class PermissionResponse(
  val status: String,
  val expires: String,
  val granted: Boolean,
  val canAskAgain: Boolean
)

private val grantedPermissionResponse = PermissionResponse(
  status = PermissionsStatus.GRANTED.status,
  expires = PermissionsResponse.PERMISSION_EXPIRES_NEVER,
  granted = true,
  canAskAgain = true
)

internal fun Module.getActivityRecognitionPermissions(): Promise<PermissionResponse> =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    requestPermissions { manager, promise ->
      manager.getPermissionsWithPromise(promise, Manifest.permission.ACTIVITY_RECOGNITION)
    }
  } else {
    Promise.resolve(grantedPermissionResponse)
  }

internal fun Module.askForActivityRecognitionPermissions(): Promise<PermissionResponse> =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    requestPermissions { manager, promise ->
      manager.askForPermissionsWithPromise(promise, Manifest.permission.ACTIVITY_RECOGNITION)
    }
  } else {
    Promise.resolve(grantedPermissionResponse)
  }

@Suppress("DEPRECATION")
private inline fun Module.requestPermissions(
  request: (Permissions, expo.modules.core.Promise) -> Unit
): Promise<PermissionResponse> {
  val result = Promise<PermissionResponse>()
  val manager = legacyAppContext.permissions
  if (manager == null) {
    result.reject(
      CodedException(
        "E_NO_PERMISSIONS",
        "Permissions module is null. Are you sure all the installed Expo modules are properly linked?",
        null
      )
    )
    return result
  }
  request(
    manager,
    object : expo.modules.core.Promise {
      override fun resolve(value: Any?) {
        val bundle = value as Bundle
        result.resolve(
          PermissionResponse(
            status = bundle.getString(PermissionsResponse.STATUS_KEY)!!,
            expires = bundle.getString(PermissionsResponse.EXPIRES_KEY)!!,
            granted = bundle.getBoolean(PermissionsResponse.GRANTED_KEY),
            canAskAgain = bundle.getBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY)
          )
        )
      }

      override fun reject(code: String?, message: String?, e: Throwable?) {
        result.reject(CodedException(code, message, e))
      }
    }
  )
  return result
}
