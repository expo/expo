package expo.modules.notifications.permissions

import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationManagerCompat
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.notifications.permissions.NotificationPermissionsModule
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.arguments.ReadableArguments
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.interfaces.permissions.PermissionsResponse

class NotificationPermissionsModule(context: Context?) : ExportedModule(context) {
  override fun getName(): String {
    return EXPORTED_NAME
  }

  @ExpoMethod
  fun getPermissionsAsync(promise: Promise) {
    promise.resolve(permissionsBundle)
  }

  @ExpoMethod
  fun requestPermissionsAsync(permissionsTypes: ReadableArguments?, promise: Promise) {
    promise.resolve(permissionsBundle)
  }

  private val permissionsBundle: Bundle
    private get() {
      val managerCompat = NotificationManagerCompat.from(context)
      val areEnabled = managerCompat.areNotificationsEnabled()
      val status = if (areEnabled) PermissionsStatus.GRANTED else PermissionsStatus.DENIED
      val permissions = Bundle()
      permissions.putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
      permissions.putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, areEnabled)
      permissions.putString(PermissionsResponse.STATUS_KEY, status.status)
      permissions.putBoolean(PermissionsResponse.GRANTED_KEY, PermissionsStatus.GRANTED == status)
      val platformPermissions = Bundle()
      platformPermissions.putInt(IMPORTANCE_KEY, managerCompat.importance)
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && manager != null) {
        platformPermissions.putInt(INTERRUPTION_FILTER_KEY, manager.currentInterruptionFilter)
      }
      permissions.putBundle(ANDROID_RESPONSE_KEY, platformPermissions)
      return permissions
    }

  companion object {
    private const val EXPORTED_NAME = "ExpoNotificationPermissionsModule"
    private const val ANDROID_RESPONSE_KEY = "android"
    private const val IMPORTANCE_KEY = "importance"
    private const val INTERRUPTION_FILTER_KEY = "interruptionFilter"
  }
}