package expo.modules.notifications.permissions

import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationManagerCompat
import androidx.core.os.bundleOf
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus

class NotificationPermissionsModule(context: Context?) : ExportedModule(context) {
  private lateinit var moduleRegistry: ModuleRegistry

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }

  override fun getName(): String {
    return EXPORTED_NAME
  }

  @ExpoMethod
  fun getPermissionsAsync(promise: Promise) {
    if (context.applicationContext.applicationInfo.targetSdkVersion >= 33 && Build.VERSION.SDK_INT >= 33) {
      getPermissionsWithPromiseImplApi33(promise)
    } else {
      getPermissionsWithPromiseImplClassic(promise)
    }
  }

  @ExpoMethod
  fun requestPermissionsAsync(permissionsTypes: ReadableArguments?, promise: Promise) {
    if (context.applicationContext.applicationInfo.targetSdkVersion >= 33 && Build.VERSION.SDK_INT >= 33) {
      requestPermissionsWithPromiseImplApi33(promise)
    } else {
      getPermissionsWithPromiseImplClassic(promise)
    }
  }

  @RequiresApi(33)
  private fun getPermissionsWithPromiseImplApi33(promise: Promise) {
    val permissionManager = moduleRegistry.getModule(Permissions::class.java)
    if (permissionManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?")
      return
    }

    permissionManager.getPermissions(
      { permissionsMap: Map<String, PermissionsResponse> ->
        val managerCompat = NotificationManagerCompat.from(context)
        val areEnabled = managerCompat.areNotificationsEnabled()
        val platformBundle = bundleOf(
          IMPORTANCE_KEY to managerCompat.importance,
        ).apply {
          val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && notificationManager != null) {
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
            ANDROID_RESPONSE_KEY to platformBundle,
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
      IMPORTANCE_KEY to managerCompat.importance,
    ).apply {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && notificationManager != null) {
        putInt(INTERRUPTION_FILTER_KEY, notificationManager.currentInterruptionFilter)
      }
    }

    promise.resolve(
      bundleOf(
        PermissionsResponse.EXPIRES_KEY to PermissionsResponse.PERMISSION_EXPIRES_NEVER,
        PermissionsResponse.STATUS_KEY to status.status,
        PermissionsResponse.CAN_ASK_AGAIN_KEY to areEnabled,
        PermissionsResponse.GRANTED_KEY to (status == PermissionsStatus.GRANTED),
        ANDROID_RESPONSE_KEY to platformBundle,
      )
    )
  }

  @RequiresApi(33)
  private fun requestPermissionsWithPromiseImplApi33(promise: Promise) {
    val permissionManager = moduleRegistry.getModule(Permissions::class.java)
    if (permissionManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?")
      return
    }

    permissionManager.askForPermissions(
      {
        getPermissionsWithPromiseImplApi33(promise)
      },
      *PERMISSIONS
    )
  }

  companion object {
    private const val EXPORTED_NAME = "ExpoNotificationPermissionsModule"
    private const val ANDROID_RESPONSE_KEY = "android"
    private const val IMPORTANCE_KEY = "importance"
    private const val INTERRUPTION_FILTER_KEY = "interruptionFilter"

    private val PERMISSIONS: Array<String>
      /**
       * TODO: Use {@link Android.Manifest.permission.POST_NOTIFICATIONS} when we support compileSdkVersion 33
       */
      get() = arrayOf("android.permission.POST_NOTIFICATIONS")
  }
}
