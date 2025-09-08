package expo.modules.medialibrary.next.permissions

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.next.permissions.enums.AccessPrivileges
import expo.modules.medialibrary.next.permissions.enums.GranularPermission
import java.lang.ref.WeakReference

class MediaLibraryPermissionPromiseWrapper(
  private val granularPermissions: List<GranularPermission>,
  private val promise: Promise,
  private val contextHolder: WeakReference<Context>
) : Promise {
  override fun resolve(value: Any?) {
    if (value !is Bundle) {
      promise.resolve(value)
      return
    }

    promise.resolve(addOnlySelectedInfoToPermissionsBundle(value, granularPermissions))
  }

  override fun reject(code: String, message: String?, cause: Throwable?) {
    promise.reject(code, message, cause)
  }

  private fun addOnlySelectedInfoToPermissionsBundle(permissionsBundle: Bundle, granularPermissions: List<GranularPermission>): Bundle {
    val context = contextHolder.get() ?: return permissionsBundle
    val areGranted = permissionsBundle.getBoolean(PermissionsResponse.Companion.GRANTED_KEY)

    // On Android < 14 we always return `all` or `none`, since it doesn't support limited access
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      val accessPrivileges = if (areGranted) {
        AccessPrivileges.ALL
      } else {
        AccessPrivileges.NONE
      }
      permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, accessPrivileges.value)
      return permissionsBundle
    }

    if (areGranted) {
      // If the permissions are granted that means that the user selected "allow all" or only audio permissions were requested and granted
      permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, AccessPrivileges.ALL.value)
      return permissionsBundle
    }

    // For photo and video access android will return DENIED status if the user selected "allow only selected"
    // we need to check if the user granted partial access to the media library and overwrite the result.
    val requiresAudioAccess = granularPermissions.contains(GranularPermission.AUDIO)
    val hasAudioAccess = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED
    val hasPartialAccess = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) == PackageManager.PERMISSION_GRANTED
    val hasRequiredAudioAccess = !requiresAudioAccess || hasAudioAccess
    val hasRequiredLimitedAccess = hasRequiredAudioAccess && hasPartialAccess

    if (hasRequiredLimitedAccess) {
      permissionsBundle.putBoolean(PermissionsResponse.Companion.GRANTED_KEY, true)
      permissionsBundle.putBoolean(PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY, true)
      permissionsBundle.putString(PermissionsResponse.Companion.STATUS_KEY, PermissionsStatus.GRANTED.status)
      permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, AccessPrivileges.LIMITED.value)
    } else {
      permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, AccessPrivileges.NONE.value)
    }

    return permissionsBundle
  }

  companion object {
    internal const val ACCESS_PRIVILEGES_PERMISSION_KEY = "accessPrivileges"
  }
}
