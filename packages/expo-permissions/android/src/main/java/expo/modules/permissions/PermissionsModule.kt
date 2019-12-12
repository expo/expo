// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.permissions

import android.Manifest
import android.content.Context
import android.os.Bundle
import expo.modules.permissions.requesters.LocationRequester
import expo.modules.permissions.requesters.NotificationRequester
import expo.modules.permissions.requesters.PermissionRequester
import expo.modules.permissions.requesters.RemindersRequester
import expo.modules.permissions.requesters.SimpleRequester
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.interfaces.permissions.Permissions
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponseListener

class PermissionsModule(context: Context) : ExportedModule(context) {
  private lateinit var mPermissions: Permissions
  private lateinit var mRequesters: Map<String, PermissionRequester>

  @Throws(IllegalStateException::class)
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mPermissions = moduleRegistry.getModule(Permissions::class.java)
        ?: throw IllegalStateException("Couldn't find implementation for Permissions interface.")

    val notificationRequester = NotificationRequester(context)
    val contactsRequester = if (mPermissions.isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      SimpleRequester(Manifest.permission.WRITE_CONTACTS, Manifest.permission.READ_CONTACTS)
    } else {
      SimpleRequester(Manifest.permission.READ_CONTACTS)
    }
    mRequesters = mapOf(
        PermissionsTypes.LOCATION.type to LocationRequester(),
        PermissionsTypes.CAMERA.type to SimpleRequester(Manifest.permission.CAMERA),
        PermissionsTypes.CONTACTS.type to contactsRequester,
        PermissionsTypes.AUDIO_RECORDING.type to SimpleRequester(Manifest.permission.RECORD_AUDIO),
        PermissionsTypes.CAMERA_ROLL.type to SimpleRequester(Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE),
        PermissionsTypes.CALENDAR.type to SimpleRequester(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR),
        PermissionsTypes.SMS.type to SimpleRequester(Manifest.permission.READ_SMS),
        PermissionsTypes.NOTIFICATIONS.type to notificationRequester,
        PermissionsTypes.USER_FACING_NOTIFICATIONS.type to notificationRequester,
        PermissionsTypes.SYSTEM_BRIGHTNESS.type to SimpleRequester(Manifest.permission.WRITE_SETTINGS),
        PermissionsTypes.REMINDERS.type to RemindersRequester()
    )
  }

  @Throws(IllegalStateException::class)
  private fun getRequester(permissionType: String): PermissionRequester {
    return mRequesters[permissionType]
        ?: throw IllegalStateException("Unrecognized permission type: $permissionType")
  }

  override fun getName(): String = "ExpoPermissions"

  @ExpoMethod
  fun getAsync(requestedPermissionsTypes: ArrayList<String>, promise: Promise) {
    try {
      mPermissions.getPermissions(PermissionsResponseListener {
        promise.resolve(parsePermissionsResponse(requestedPermissionsTypes, it))
      }, *getAndroidPermissionsFromList(requestedPermissionsTypes))
    } catch (e: IllegalStateException) {
      promise.reject(ERROR_TAG + "_UNKNOWN", "Failed to get permissions", e)
    }
  }

  @ExpoMethod
  fun askAsync(requestedPermissionsTypes: ArrayList<String>, promise: Promise) {
    try {
      mPermissions.askForPermissions(PermissionsResponseListener {
        promise.resolve(parsePermissionsResponse(requestedPermissionsTypes, it))
      }, *getAndroidPermissionsFromList(requestedPermissionsTypes))

    } catch (e: IllegalStateException) {
      promise.reject(ERROR_TAG + "_UNKNOWN", "Failed to get permissions", e)
    }
  }

  @Throws(IllegalStateException::class)
  private fun parsePermissionsResponse(requestedPermissionsTypes: List<String>, permissionMap: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      requestedPermissionsTypes.forEach {
        putBundle(it, getRequester(it).parseAndroidPermissions(permissionMap))
      }
    }
  }

  @Throws(IllegalStateException::class)
  private fun getAndroidPermissionsFromList(requestedPermissionsTypes: List<String>): Array<String> {
    return requestedPermissionsTypes
        .map { getRequester(it).getAndroidPermissions() }
        .reduce { acc, list -> acc + list }
        .toTypedArray()
  }
}
