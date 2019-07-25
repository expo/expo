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
import android.support.v4.app.NotificationManagerCompat

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.UIManager
import org.unimodules.interfaces.permissions.Permissions
import org.unimodules.interfaces.permissions.PermissionsListener

import kotlin.collections.ArrayList
import kotlin.collections.HashSet

private const val EXPIRES_KEY = "expires"
private const val STATUS_KEY = "status"
private const val GRANTED_VALUE = "granted"
private const val DENIED_VALUE = "denied"
private const val UNDETERMINED_VALUE = "undetermined"
private const val ERROR_TAG = "E_PERMISSIONS"

private const val PERMISSION_EXPIRES_NEVER = "never"

class PermissionsModule(context: Context) : ExportedModule(context), LifecycleEventListener {
  private var mPermissionsRequester: PermissionsRequester? = null
  private var mPermissions: Permissions? = null
  private var mActivityProvider: ActivityProvider? = null
  private val mPermissionsAskedFor = HashSet<String>()

  // state holders for asking for writing permissions
  private var mWritingPermissionBeingAsked = false // change this directly before calling corresponding startActivity
  private var mAskAsyncPromise: Promise? = null
  private var mAskAsyncRequestedPermissionsTypes: ArrayList<String>? = null
  private var mAskAsyncPermissionsTypesToBeAsked: ArrayList<String>? = null

  /* Bundle section */
  private fun getNotificationPermissions(): Bundle {
    val response = Bundle()
    val areEnabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
    response.putString(STATUS_KEY, if (areEnabled) GRANTED_VALUE else DENIED_VALUE)
    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    return response
  }

  private fun getLocationPermissions(): Bundle {
    val response = Bundle()
    var scope = "none"
    try {
      when {
        isPermissionGranted(Manifest.permission.ACCESS_FINE_LOCATION) -> {
          response.putString(STATUS_KEY, GRANTED_VALUE)
          scope = "fine"
        }
        isPermissionGranted(Manifest.permission.ACCESS_COARSE_LOCATION) -> {
          response.putString(STATUS_KEY, GRANTED_VALUE)
          scope = "coarse"
        }
        mPermissionsAskedFor.contains("location") -> response.putString(STATUS_KEY, DENIED_VALUE)
        else -> response.putString(STATUS_KEY, UNDETERMINED_VALUE)
      }
    } catch (e: IllegalStateException) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE)
    }

    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    val platformMap = Bundle()
    platformMap.putString("scope", scope)
    response.putBundle("android", platformMap)

    return response
  }

  // checkSelfPermission does not return accurate status of WRITE_SETTINGS
  private fun getWriteSettingsPermission(): Bundle {
    val response = Bundle()
    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      when {
        Settings.System.canWrite(mActivityProvider!!.currentActivity.applicationContext) -> response.putString(STATUS_KEY, GRANTED_VALUE)
        mPermissionsAskedFor.contains("systemBrightness") -> response.putString(STATUS_KEY, DENIED_VALUE)
        else -> response.putString(STATUS_KEY, UNDETERMINED_VALUE)
      }
    } else {
      response.putString(STATUS_KEY, GRANTED_VALUE)
    }

    return response
  }

  private fun getCameraRollPermissions(): Bundle {
    val response = Bundle()
    try {
      when {
        arePermissionsGranted(
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE)
        ) -> response.putString(STATUS_KEY, GRANTED_VALUE)
        mPermissionsAskedFor.contains("cameraRoll") -> response.putString(STATUS_KEY, DENIED_VALUE)
        else -> response.putString(STATUS_KEY, UNDETERMINED_VALUE)
      }
    } catch (e: IllegalStateException) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE)
    }

    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)

    return response
  }

  private fun getCalendarPermissions(): Bundle {
    val response = Bundle()
    try {
      when {
        arePermissionsGranted(
            arrayOf(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
        ) -> response.putString(STATUS_KEY, GRANTED_VALUE)
        mPermissionsAskedFor.contains("calendar") -> response.putString(STATUS_KEY, DENIED_VALUE)
        else -> response.putString(STATUS_KEY, DENIED_VALUE)
      }
    } catch (e: IllegalStateException) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE)
    }

    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)

    return response
  }
  /* End bundle section */

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mPermissionsRequester = PermissionsRequester(moduleRegistry)
    mPermissions = moduleRegistry.getModule(Permissions::class.java)
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
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
      when (type) {
        "notifications", "userFacingNotifications", "reminders", "systemBrightness" -> {}
        "location" -> {
          permissionsTypesToBeAsked.add(Manifest.permission.ACCESS_FINE_LOCATION)
          permissionsTypesToBeAsked.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
        "camera" -> {
          permissionsTypesToBeAsked.add(Manifest.permission.CAMERA)
        }
        "contacts" -> {
          permissionsTypesToBeAsked.add(Manifest.permission.READ_CONTACTS)
          if (isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
            // Ask for WRITE_CONTACTS permission only if the permission is present in AndroidManifest.
            permissionsTypesToBeAsked.add(Manifest.permission.WRITE_CONTACTS)
          }
        }
        "audioRecording" -> {
          permissionsTypesToBeAsked.add(Manifest.permission.RECORD_AUDIO)
        }
        "cameraRoll" -> {
          permissionsTypesToBeAsked.add(Manifest.permission.READ_EXTERNAL_STORAGE)
          permissionsTypesToBeAsked.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
        "calendar" -> {
          permissionsTypesToBeAsked.add(Manifest.permission.READ_CALENDAR)
          permissionsTypesToBeAsked.add(Manifest.permission.WRITE_CALENDAR)
        }
        else -> {
          return promise.reject(
              ERROR_TAG + "_UNSUPPORTED",
              String.format("Cannot request permission: %s", type)
          )
        }
      }// we do not have to ask for it
      // here we do nothing but later we're checking whether to launch WritingSettingsActivity
    }

    // check whether to launch WritingSettingsActivity
    if (requestedPermissionsTypesSet.contains("systemBrightness") &&
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
      mPermissionsAskedFor.add("systemBrightness")
      return
    }

    mPermissionsAskedFor.addAll(requestedPermissionsTypesSet)
    askForPermissions(requestedPermissionsTypes, permissionsTypesToBeAsked, promise)
  }

  private fun askForPermissions(requestedPermissionsTypes: ArrayList<String>?,
                                permissionsTypesToBeAsked: ArrayList<String>,
                                promise: Promise) {
    val askedPermissions = mPermissionsRequester!!.askForPermissions(
        permissionsTypesToBeAsked.toTypedArray(), // permissionsTypesToBeAsked handles empty array
        PermissionsListener { _, _ ->
          promise.resolve(getPermissions(requestedPermissionsTypes!!)) // read all requested permissions statuses
        })

    if (!askedPermissions) {
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
    when (permissionType) {
      "notifications", "userFacingNotifications" -> return getNotificationPermissions()
      "location" -> return getLocationPermissions()
      "camera" -> return getSimplePermission(Manifest.permission.CAMERA)
      "contacts" -> return getSimplePermission(Manifest.permission.READ_CONTACTS)
      "audioRecording" -> return getSimplePermission(Manifest.permission.RECORD_AUDIO)
      "systemBrightness" -> return getWriteSettingsPermission()
      "cameraRoll" -> return getCameraRollPermissions()
      "calendar" -> return getCalendarPermissions()
      "SMS" -> return getSimplePermission(Manifest.permission.READ_SMS)
      "reminders" -> {
        val response = Bundle()
        response.putString(STATUS_KEY, GRANTED_VALUE)
        response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
        return response
      }
      else -> throw IllegalStateException(String.format("Unrecognized permission type: %s", permissionType))
    }
  }

  /**
   * Checks status for Android built-in permission
   *
   * @param permission [Manifest.permission]
   */
  private fun getSimplePermission(permission: String): Bundle {
    val response = Bundle()

    try {
      when {
        isPermissionGranted(permission) -> response.putString(STATUS_KEY, GRANTED_VALUE)
        mPermissionsAskedFor.contains(permission) -> response.putString(STATUS_KEY, DENIED_VALUE)
        else -> response.putString(STATUS_KEY, UNDETERMINED_VALUE)
      }
    } catch (e: IllegalStateException) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE)
    }

    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)

    return response
  }

  /**
   * Checks whether given permission is granted or not.
   * Throws IllegalStateException there's no Permissions module present.
   */
  private fun isPermissionGranted(permission: String): Boolean {
    if (mPermissions != null) {
      return mPermissions?.getPermission(permission) == PackageManager.PERMISSION_GRANTED
    } else {
      throw IllegalStateException("No Permissions module present.")
    }
  }

  /**
   * Checks whether all given permissions are granted or not.
   * Throws IllegalStateException there's no Permissions module present.
   */
  private fun arePermissionsGranted(permissions: Array<String>): Boolean {
    if (mPermissions != null) {
      throw IllegalStateException("No Permissions module present.")
    }

    val permissionsResults = mPermissions!!.getPermissions(permissions)
    return permissionsResults.count { it == PackageManager.PERMISSION_GRANTED } == permissions.size
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
    // Launch systems dialog for write settings
    val intent = Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS)
    intent.data = Uri.parse("package:" + context.packageName)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    mWritingPermissionBeingAsked = true
    context.startActivity(intent)
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
    askForPermissions(askAsyncRequestedPermissionsTypes, askAsyncPermissionsTypesToBeAsked!!, askAsyncPromise!!)
  }

  override fun onHostPause() {
    // do nothing
  }

  override fun onHostDestroy() {
    // do nothing
  }

}
