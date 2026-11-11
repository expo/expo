package expo.modules.notifications.permissions

import android.Manifest
import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationManagerCompat
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
      getExactAlarmPermissionsResponse()
    }

    AsyncFunction("requestExactAlarmPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || canScheduleExactAlarms()) {
        promise.resolve(getExactAlarmPermissionsResponse())
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
        val response = getExactAlarmPermissionsResponse()
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

  private fun getExactAlarmPermissionsResponse(): ExactAlarmPermissionResponse {
    val granted = canScheduleExactAlarms()
    val status = if (granted) {
      PermissionsStatus.GRANTED
    } else {
      PermissionsStatus.DENIED
    }
    return ExactAlarmPermissionResponse(
      status = status.status,
      canAskAgain = granted || isScheduleExactAlarmDeclared(),
      granted = granted
    )
  }

  @RequiresApi(33)
  private fun getPermissionsWithPromiseImplApi33(promise: Promise) {
    permissions.getPermissions(
      { permissionsMap: Map<String, PermissionsResponse> ->
        val managerCompat = NotificationManagerCompat.from(context)
        val areEnabled = managerCompat.areNotificationsEnabled()
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
          NotificationPermissionResponse(
            status = status,
            canAskAgain = canAskAgain,
            granted = areAllGranted,
            android = getAndroidDetails(managerCompat)
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

    promise.resolve(
      NotificationPermissionResponse(
        status = status.status,
        canAskAgain = areEnabled,
        granted = status == PermissionsStatus.GRANTED,
        android = getAndroidDetails(managerCompat)
      )
    )
  }

  private fun getAndroidDetails(managerCompat: NotificationManagerCompat) =
    AndroidNotificationPermissionDetails(
      importance = managerCompat.importance,
      interruptionFilter = managerCompat.currentInterruptionFilter
    )

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
