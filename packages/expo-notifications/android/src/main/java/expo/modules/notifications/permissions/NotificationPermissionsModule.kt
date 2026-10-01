package expo.modules.notifications.permissions

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
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
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ExactAlarmPermissionNotDeclaredException
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

  private val pendingExactAlarmPromises = mutableListOf<Promise>()

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

    AsyncFunction("getExactAlarmPermissionsAsync") {
      getExactAlarmPermissionsBundle()
    }

    AsyncFunction("requestExactAlarmPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || canScheduleExactAlarms()) {
        promise.resolve(getExactAlarmPermissionsBundle())
        return@AsyncFunction
      }
      if (!isScheduleExactAlarmDeclared()) {
        throw ExactAlarmPermissionNotDeclaredException()
      }
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      pendingExactAlarmPromises.add(promise)
      val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
      try {
        activity.startActivity(intent)
      } catch (e: Throwable) {
        pendingExactAlarmPromises.remove(promise)
        throw e
      }
    }.runOnQueue(Queues.MAIN)

    OnActivityEntersForeground {
      if (pendingExactAlarmPromises.isNotEmpty()) {
        val promises = pendingExactAlarmPromises.toList()
        pendingExactAlarmPromises.clear()
        val response = getExactAlarmPermissionsBundle()
        promises.forEach { it.resolve(response) }
      }
    }
  }

  private fun canScheduleExactAlarms(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return true
    }
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    return alarmManager?.canScheduleExactAlarms() ?: false
  }

  private fun isScheduleExactAlarmDeclared(): Boolean {
    val requested = if (Build.VERSION.SDK_INT >= 33) {
      context.packageManager
        .getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(PackageManager.GET_PERMISSIONS.toLong()))
        .requestedPermissions
    } else {
      @Suppress("DEPRECATION")
      context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS).requestedPermissions
    }
    return requested?.contains(Manifest.permission.SCHEDULE_EXACT_ALARM) == true
  }

  private fun getExactAlarmPermissionsBundle(): Bundle {
    val granted = canScheduleExactAlarms()
    val status = if (granted) {
      PermissionsStatus.GRANTED
    } else {
      PermissionsStatus.DENIED
    }
    return bundleOf(
      PermissionsResponse.EXPIRES_KEY to PermissionsResponse.PERMISSION_EXPIRES_NEVER,
      PermissionsResponse.STATUS_KEY to status.status,
      PermissionsResponse.CAN_ASK_AGAIN_KEY to (granted || isScheduleExactAlarmDeclared()),
      PermissionsResponse.GRANTED_KEY to granted
    )
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
    val status = if (areEnabled) {
      PermissionsStatus.GRANTED
    } else {
      PermissionsStatus.DENIED
    }
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
