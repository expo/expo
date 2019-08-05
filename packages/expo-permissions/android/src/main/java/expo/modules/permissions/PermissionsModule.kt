// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.permissions

import android.Manifest
import android.annotation.TargetApi
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import expo.modules.permissions.requesters.*

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.UIManager
import org.unimodules.interfaces.permissions.Permissions

import kotlin.collections.ArrayList
import kotlin.collections.HashSet
import kotlin.properties.Delegates

internal const val EXPIRES_KEY = "expires"
internal const val STATUS_KEY = "status"
internal const val GRANTED_VALUE = "granted"
internal const val DENIED_VALUE = "denied"
internal const val UNDETERMINED_VALUE = "undetermined"
internal const val ERROR_TAG = "E_PERMISSIONS"

internal const val PERMISSION_EXPIRES_NEVER = "never"

class PermissionsModule(context: Context) : ExportedModule(context), LifecycleEventListener {

  private var mActivityProvider: ActivityProvider? = null

  // state holders for asking for writing permissions
  private var mWritingPermissionBeingAsked = false // change this directly before calling corresponding startActivity
  private var mAskAsyncPromise: Promise? = null
  private var mAskAsyncRequestedPermissionsTypes: ArrayList<String>? = null
  private var mAskAsyncPermissionsTypesToBeAsked: ArrayList<String>? = null

  private var mRequesters: Map<String, PermissionRequester> by Delegates.notNull()

  companion object {
    private val mPermissionsAskedFor = HashSet<String>()
    fun didAsk(permission: String): Boolean {
      return mPermissionsAskedFor.contains(permission)
    }

    private var mPermissions: Permissions? = null
    fun getPermissionService(): Permissions {
      return mPermissions ?: throw IllegalStateException("No Permissions module present.")
    }
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mPermissions = moduleRegistry.getModule(Permissions::class.java)
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)

    val notificationRequester = NotificationRequester(context)
    mRequesters = mapOf(
        PermissionsTypes.LOCATION.type to LocationRequester(),
        PermissionsTypes.CAMERA.type to SimpleRequester(Manifest.permission.CAMERA),
        PermissionsTypes.CONTACTS.type to SimpleRequester(Manifest.permission.READ_CONTACTS),
        PermissionsTypes.AUDIO_RECORDING.type to SimpleRequester(Manifest.permission.RECORD_AUDIO),
        PermissionsTypes.CAMERA_ROLL.type to CameraRollRequester(),
        PermissionsTypes.CALENDAR.type to CalendarRequester(),
        PermissionsTypes.SMS.type to SimpleRequester(Manifest.permission.READ_SMS),
        PermissionsTypes.REMINDERS.type to RemindersRequester(),
        PermissionsTypes.NOTIFICATIONS.type to notificationRequester,
        PermissionsTypes.USER_FACING_NOTIFICATIONS.type to notificationRequester,
        PermissionsTypes.SYSTEM_BRIGHTNESS.type to SystemBrightnessRequester(mActivityProvider!!)
    )
  }

  override fun getName(): String = "ExpoPermissions"

  @ExpoMethod
  fun getAsync(requestedPermissionsTypes: ArrayList<String>, promise: Promise) {
    try {
      promise.resolve(getPermissions(requestedPermissionsTypes))
    } catch (e: IllegalStateException) {
      promise.reject(ERROR_TAG + "_UNKNOWN", e)
    }
  }

  @ExpoMethod
  fun askAsync(requestedPermissionsTypes: ArrayList<String>, promise: Promise) {
    val requestedPermissionsTypesSet = HashSet(requestedPermissionsTypes)
    try {
      val existingPermissions = getPermissions(requestedPermissionsTypes)

      // iterate over existing permissions and filter out those that are already granted
      for (elementBundleKey in existingPermissions.keySet()) {
        val elementBundle = existingPermissions.getBundle(elementBundleKey) ?: Bundle()
        if (elementBundle.getString(STATUS_KEY) != null &&
            elementBundle.getString(STATUS_KEY) == GRANTED_VALUE) {
          requestedPermissionsTypesSet.remove(elementBundleKey)
        }
      }

      // all permissions are granted - resolve with them
      if (requestedPermissionsTypesSet.isEmpty()) {
        return promise.resolve(existingPermissions)
      }
    } catch (e: IllegalStateException) {
      return promise.reject(ERROR_TAG + "_UNKNOWN", e)
    }

    // proceed with asking for non-granted permissions
    val permissionsTypesToBeAsked = ArrayList<String>()
    for (type in requestedPermissionsTypesSet) {
      try {
        permissionsTypesToBeAsked.addAll(getRequester(type).getPermissionToAsk())
        if (type == "contacts" && isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
          // Ask for WRITE_CONTACTS permission only if the permission is present in AndroidManifest.
          permissionsTypesToBeAsked.add(Manifest.permission.WRITE_CONTACTS)
        }
      } catch (e: IllegalStateException) {
        return promise.reject(
            ERROR_TAG + "_UNSUPPORTED",
            String.format("Cannot request permission: %s", type)
        )
      }
    }

    // check whether to launch WritingSettingsActivity
    if (requestedPermissionsTypesSet.contains(PermissionsTypes.SYSTEM_BRIGHTNESS.type) &&
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (mAskAsyncPromise != null) {
        return promise.reject(
            ERROR_TAG + "_ASKING_IN_PROGRESS",
            "Different asking for permissions in progress. Await the old request and then try again."
        )
      }
      mAskAsyncPromise = promise
      mAskAsyncRequestedPermissionsTypes = requestedPermissionsTypes
      mAskAsyncPermissionsTypesToBeAsked = permissionsTypesToBeAsked
      askForWriteSettingsPermissionFirst()
      mPermissionsAskedFor.add(PermissionsTypes.SYSTEM_BRIGHTNESS.type)
      mPermissionsAskedFor.addAll(requestedPermissionsTypesSet) // todo: maybe move it to `onHostResume` function?
      return
    }

    mPermissionsAskedFor.addAll(requestedPermissionsTypesSet)
    askForPermissions(requestedPermissionsTypes, permissionsTypesToBeAsked, promise)
  }

  private fun askForPermissions(requestedPermissionsTypes: ArrayList<String>,
                                permissionsTypesToBeAsked: ArrayList<String>,
                                promise: Promise) {
    try {
      getPermissionService().askForPermissions(
          permissionsTypesToBeAsked.toTypedArray() // permissionsTypesToBeAsked handles empty array
      ) { promise.resolve(getPermissions(requestedPermissionsTypes)) }
    } catch (e: IllegalStateException) {
      promise.reject(
          ERROR_TAG + "_UNAVAILABLE",
          "Permissions module is null. Are you sure all the installed Expo modules are properly linked?"
      )
    }
  }

  @Throws(IllegalStateException::class)
  private fun getPermissions(permissionsTypes: ArrayList<String>): Bundle {
    val permissions = Bundle()
    for (permissionType in permissionsTypes) {
      permissions.putBundle(permissionType, getPermission(permissionType))
    }
    return permissions
  }

  @Throws(IllegalStateException::class)
  private fun getPermission(permissionType: String): Bundle {
    return getRequester(permissionType).getPermission()
  }

  private fun getRequester(permissionType: String): PermissionRequester {
    return mRequesters[permissionType] ?: throw IllegalStateException("Unrecognized permission type: $permissionType")
  }

  /**
   * Checks whether given permission is present in AndroidManifest or not.
   */
  private fun isPermissionPresentInManifest(permission: String): Boolean {
    try {
      val packageInfo = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)

      if (packageInfo.requestedPermissions != null) {
        return packageInfo.requestedPermissions.contains(permission)
      }
      return false
    } catch (e: PackageManager.NameNotFoundException) {
      return false
    }
  }

  /**
   * Asking for [android.provider.Settings.ACTION_MANAGE_WRITE_SETTINGS] via separate activity
   * WARNING: has to be asked first among all permissions being asked in request
   * Scenario that forces this order:
   * 1. user asks for "systemBrightness" (actual [android.provider.Settings.ACTION_MANAGE_WRITE_SETTINGS]) and for some other permission (e.g. [android.Manifest.permission.CAMERA])
   * 2. first goes ACTION_MANAGE_WRITE_SETTINGS that moves app into background and launches system-specific fullscreen activity
   * 3. upon user action system resumes app and [onHostResume] is being called for the first time and logic for other permission is invoked
   * 4. other permission invokes other system-specific activity that is visible as dialog what moves app again into background
   * 5. upon user action app is restored and [onHostResume] is being called again, but no further action is invoked and promise is resolved
   */
  @TargetApi(Build.VERSION_CODES.M)
  private fun askForWriteSettingsPermissionFirst() {
    Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
      data = Uri.parse("package:" + context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }.let {
      mWritingPermissionBeingAsked = true
      context.startActivity(it)
    }
  }

  override fun onHostResume() {
    if (!mWritingPermissionBeingAsked) {
      return
    }
    mWritingPermissionBeingAsked = false

    // cleanup
    val askAsyncPromise = mAskAsyncPromise
    val askAsyncRequestedPermissionsTypes = mAskAsyncRequestedPermissionsTypes
    val askAsyncPermissionsTypesToBeAsked = mAskAsyncPermissionsTypesToBeAsked

    mAskAsyncPromise = null
    mAskAsyncRequestedPermissionsTypes = null
    mAskAsyncPermissionsTypesToBeAsked = null


    // invoke actual asking for permissions
    askForPermissions(askAsyncRequestedPermissionsTypes!!, askAsyncPermissionsTypesToBeAsked!!, askAsyncPromise!!)
  }

  override fun onHostPause() {
    // do nothing
  }

  override fun onHostDestroy() {
    // do nothing
  }

}
