package expo.modules.notifications.permissions

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
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
private const val SCHEDULE_EXACT_REQUEST_CODE = 2975
private val PERMISSIONS: Array<String> = arrayOf(Manifest.permission.POST_NOTIFICATIONS)

class NotificationPermissionsModule : Module() {
  private val permissions: Permissions
    get() = appContext.permissions ?: throw ModuleNotFoundException(Permissions::class)

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private lateinit var alarmManager : AlarmManager
  private var pendingScheduleExactPromise: Promise? = null


  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationPermissionsModule")

    OnCreate {
      alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        ?: throw IllegalStateException("Cannot get AlarmManager service")
    }

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

    AsyncFunction("requestScheduleExactPermissionsAsync") { _: ReadableArguments?, promise: Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        pendingScheduleExactPromise = promise
        requestScheduleExactPermissions()
      } else {
        promise.resolve(scheduleExactResponseBundle(true))
      }
    }

    AsyncFunction("getScheduleExactPermissionsAsync") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        scheduleExactResponseBundle(alarmManager.canScheduleExactAlarms())
      } else {
        scheduleExactResponseBundle(true)
      }
    }


    OnActivityResult { _, result ->
      if (result.requestCode == SCHEDULE_EXACT_REQUEST_CODE && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val hasGrantedPermission = alarmManager.canScheduleExactAlarms()
        pendingScheduleExactPromise?.resolve(scheduleExactResponseBundle(hasGrantedPermission))
        pendingScheduleExactPromise = null
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

  @RequiresApi(31)
  private fun requestScheduleExactPermissions() {
    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
    intent.setData(Uri.fromParts("package", context.packageName, null))
    appContext.currentActivity?.startActivityForResult(intent, SCHEDULE_EXACT_REQUEST_CODE)
  }

  private fun scheduleExactResponseBundle(hasGrantedPermission: Boolean): Bundle {
    // This permission can't be `undetermined`
    val status = if (hasGrantedPermission) PermissionsStatus.GRANTED.status else PermissionsStatus.DENIED.status
    return bundleOf(
      PermissionsResponse.EXPIRES_KEY to PermissionsResponse.PERMISSION_EXPIRES_NEVER,
      PermissionsResponse.STATUS_KEY to status,
      PermissionsResponse.CAN_ASK_AGAIN_KEY to true, // We can always ask again
      PermissionsResponse.GRANTED_KEY to hasGrantedPermission,
    )
  }
}
