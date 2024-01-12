package expo.modules.notifications.permissions

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationManagerCompat
import androidx.core.os.bundleOf
import expo.modules.core.arguments.ReadableArguments
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ModuleNotFoundException

private const val ANDROID_RESPONSE_KEY = "android"
private const val IMPORTANCE_KEY = "importance"
private const val INTERRUPTION_FILTER_KEY = "interruptionFilter"
private val PERMISSIONS: Array<String> = arrayOf(Manifest.permission.POST_NOTIFICATIONS)

class NotificationPermissionsModule : Module() {
  private val permissions: Permissions
    get() = appContext.permissions ?: throw ModuleNotFoundException(Permissions::class)

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationPermissionsModule")

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      if (context.applicationContext.applicationInfo.targetSdkVersion >= 33 && Build.VERSION.SDK_INT >= 33) {
        getPermissionsWithPromiseImplApi33(promise)
      } else {
        getPermissionsWithPromiseImplClassic(promise)
      }
    }

    AsyncFunction("requestPermissionsAsync") { _: ReadableArguments?, promise: Promise ->
      if (context.applicationContext.applicationInfo.targetSdkVersion >= 33 && Build.VERSION.SDK_INT >= 33) {
        requestPermissionsWithPromiseImplApi33(promise)
      } else {
        getPermissionsWithPromiseImplClassic(promise)
      }
    }
  }

  @RequiresApi(33)
  private fun getPermissionsWithPromiseImplApi33(promise: Promise) {
    permissions.getPermissions(
      { permissionsMap: Map<String, PermissionsResponse> ->
        val managerCompat = NotificationManagerCompat.from(context)
        val areEnabled = managerCompat.areNotificationsEnabled()
        val platformBundle = bundleOf(
          IMPORTANCE_KEY to managerCompat.importance
        ).apply {
          val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
          if (notificationManager != null) {
            putInt(INTERRUPTION_FILTER_KEY, notificationManager.currentInterruptionFilter)
          }
        }

        val areAllGranted = permissionsMap.all { (_, response) -> response.status == PermissionsStatus.GRANTED }
        val areAllDenied = permissionsMap.all { (_, response) -> response.status == PermissionsStatus.DENIED }
        val canAskAgain = permissionsMap.all { (_, response) -> response.canAskAgain }
        val status = when {
          areAllDenied -> PermissionsStatus.DENIED.status
          !areEnabled -> PermissionsStatus.DENIED.status
          areAllGranted -> PermissionsStatus.GRANTED.status
          else -> PermissionsStatus.UNDETERMINED.status
        }

        promise.resolve(
          bundleOf(
            PermissionsResponse.EXPIRES_KEY to PermissionsResponse.PERMISSION_EXPIRES_NEVER,
            PermissionsResponse.STATUS_KEY to status,
            PermissionsResponse.CAN_ASK_AGAIN_KEY to canAskAgain,
            PermissionsResponse.GRANTED_KEY to areAllGranted,
            ANDROID_RESPONSE_KEY to platformBundle
          )
        )
      },
      *PERMISSIONS
    )
  }

  private fun getPermissionsWithPromiseImplClassic(promise: Promise) {
    val managerCompat = NotificationManagerCompat.from(context)
    val areEnabled = managerCompat.areNotificationsEnabled()
    val status = if (areEnabled) PermissionsStatus.GRANTED else PermissionsStatus.DENIED
    val platformBundle = bundleOf(
      IMPORTANCE_KEY to managerCompat.importance
    ).apply {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      if (notificationManager != null) {
        putInt(INTERRUPTION_FILTER_KEY, notificationManager.currentInterruptionFilter)
      }
    }

    promise.resolve(
      bundleOf(
        PermissionsResponse.EXPIRES_KEY to PermissionsResponse.PERMISSION_EXPIRES_NEVER,
        PermissionsResponse.STATUS_KEY to status.status,
        PermissionsResponse.CAN_ASK_AGAIN_KEY to areEnabled,
        PermissionsResponse.GRANTED_KEY to (status == PermissionsStatus.GRANTED),
        ANDROID_RESPONSE_KEY to platformBundle
      )
    )
  }

  @RequiresApi(33)
  private fun requestPermissionsWithPromiseImplApi33(promise: Promise) {
    permissions.askForPermissions(
      {
        getPermissionsWithPromiseImplApi33(promise)
      },
      *PERMISSIONS
    )
  }
}
