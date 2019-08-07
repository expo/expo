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
import android.support.v4.content.ContextCompat

import com.facebook.react.modules.core.PermissionAwareActivity

import expo.modules.permissions.requesters.CalendarRequester
import expo.modules.permissions.requesters.CameraRollRequester
import expo.modules.permissions.requesters.LocationRequester
import expo.modules.permissions.requesters.NotificationRequester
import expo.modules.permissions.requesters.PermissionRequester
import expo.modules.permissions.requesters.RemindersRequester
import expo.modules.permissions.requesters.SimpleRequester
import expo.modules.permissions.requesters.SystemBrightnessRequester

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.UIManager
import org.unimodules.interfaces.permissions.Permissions

private const val PERMISSIONS_REQUEST: Int = 13

internal const val EXPIRES_KEY = "expires"
internal const val STATUS_KEY = "status"
internal const val GRANTED_VALUE = "granted"
internal const val DENIED_VALUE = "denied"
internal const val UNDETERMINED_VALUE = "undetermined"
internal const val ERROR_TAG = "E_PERMISSIONS"

internal const val PERMISSION_EXPIRES_NEVER = "never"

class PermissionsService(val context: Context): InternalModule, Permissions, LifecycleEventListener {
  private lateinit var mActivityProvider: ActivityProvider
  private lateinit var mRequesters: Map<String, PermissionRequester>

  // state holders for asking for writing permissions
  private var mWritingPermissionBeingAsked = false // change this directly before calling corresponding startActivity
  private var mAskAsyncListener: Permissions.PermissionsRequesterListenerBundle? = null
  private var mAskAsyncRequestedPermissionsTypes: Array<out String>? = null
  private var mAskAsyncPermissionsTypesToBeAsked: ArrayList<String>? = null

  companion object {
    private val mPermissionsAskedFor = HashSet<String>()
    fun didAsk(permission: String): Boolean = mPermissionsAskedFor.contains(permission)

    private lateinit var mPermissions: Permissions
    fun getPermissionService(): Permissions = mPermissions
  }

  override fun getExportedInterfaces(): List<Class<out Any>> = listOf(Permissions::class.java)

  @Throws(IllegalStateException::class)
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java) ?: throw IllegalStateException("Couldn't find implementation for ActivityProvider.")
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    mPermissions = this

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
        PermissionsTypes.SYSTEM_BRIGHTNESS.type to SystemBrightnessRequester(mActivityProvider)
    )
  }

  @Throws(IllegalStateException::class)
  private fun getRequester(permissionType: String): PermissionRequester {
    return mRequesters[permissionType] ?: throw IllegalStateException("Unrecognized permission type: $permissionType")
  }

  override fun getPermissionsBundle(permissionTypes: Array<out String>?): Bundle {
    if (permissionTypes == null) {
      return Bundle()
    }

    return Bundle().apply {
      for (permissionType in permissionTypes) {
        putBundle(permissionType, getRequester(permissionType).getPermission())
      }
    }
  }

  override fun hasPermissionsByTypes(permissionsTypes: Array<out String>?): Boolean {
    with(getPermissionsBundle(permissionsTypes)) {
      for (elementBundleKey in keySet()) {
        val elementBundle = getBundle(elementBundleKey) ?: Bundle()
        if (elementBundle.getString(STATUS_KEY) != null &&
            elementBundle.getString(STATUS_KEY) != GRANTED_VALUE) {
          return false
        }
      }
    }
    return true
  }

  override fun askForPermissionsBundle(permissionsTypes: Array<out String>?, listener: Permissions.PermissionsRequesterListenerBundle?) {
    if (permissionsTypes == null || listener == null){
      throw NullPointerException("permissionsTypes or listener can not be null")
    }

    val existingPermissions = getPermissionsBundle(permissionsTypes)
    val permissionsTypesSet = permissionsTypes.toHashSet()
    for (elementBundleKey in existingPermissions.keySet()) {
      with(existingPermissions.getBundle(elementBundleKey) ?: Bundle()) {
        if (getString(STATUS_KEY) != null && getString(STATUS_KEY) == GRANTED_VALUE) {
          permissionsTypesSet.remove(elementBundleKey)
        }
      }
    }

    // all permissions are granted - resolve with them
    if (permissionsTypesSet.isEmpty()) {
      return listener.onPermissionsResult(existingPermissions)
    }

    val permissionsToBeAsked = ArrayList<String>()
    permissionsTypesSet.forEach { permissionsToBeAsked.addAll(getRequester(it).getPermissionToAsk()) }
    if (permissionsTypesSet.contains("contacts") && isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      // Ask for WRITE_CONTACTS permission only if the permission is present in AndroidManifest.
      permissionsToBeAsked.add(Manifest.permission.WRITE_CONTACTS)
    }

    // check whether to launch WritingSettingsActivity
    if (permissionsTypesSet.contains("systemBrightness") &&
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (mAskAsyncListener != null) {
        throw IllegalStateException("Different asking for permissions in progress. Await the old request and then try again.")
      }
      mAskAsyncListener = listener
      mAskAsyncRequestedPermissionsTypes = permissionsTypes
      mAskAsyncPermissionsTypesToBeAsked = permissionsToBeAsked
      mPermissionsAskedFor.add("systemBrightness")
      askForWriteSettingsPermissionFirst()
      return
    }

    mPermissionsAskedFor.addAll(permissionsToBeAsked)
    askForPermissions(permissionsToBeAsked.toTypedArray()) { listener.onPermissionsResult(getPermissionsBundle(permissionsTypes)) }
  }

  override fun getPermissions(permissions: Array<String>): IntArray {
    return IntArray(permissions.size) { getPermission(permissions[it]) }
  }

  override fun getPermission(permission: String): Int {
    with(mActivityProvider.currentActivity) {
      if (this != null && this is PermissionAwareActivity) {
        return ContextCompat.checkSelfPermission(this, permission)
      }
    }
    return PackageManager.PERMISSION_DENIED
  }

  override fun askForPermissions(permissions: Array<String>, listener: Permissions.PermissionsRequestListener) {
    with(mActivityProvider.currentActivity) {
      if (this != null && this is PermissionAwareActivity) {
        requestPermissions(permissions, PERMISSIONS_REQUEST) { requestCode, receivePermissions, grantResults ->
          when (PERMISSIONS_REQUEST) {
            requestCode -> {
              listener.onPermissionsResult(grantResults)
              true
            }
            else -> {
              listener.onPermissionsResult(IntArray(receivePermissions.size) { PackageManager.PERMISSION_DENIED })
              false
            }
          }
        }
      } else {
        listener.onPermissionsResult(IntArray(permissions.size) { PackageManager.PERMISSION_DENIED })
      }
    }
  }

  override fun askForPermission(permission: String, listener: Permissions.PermissionRequestListener) {
    askForPermissions(arrayOf(permission)) { listener.onPermissionResult(it[0]) }
  }

  override fun hasPermissions(permissions: Array<String>): Boolean
    = getPermissions(permissions).all { it == PackageManager.PERMISSION_GRANTED }


  /**
   * Checks whether given permission is present in AndroidManifest or not.
   */
  private fun isPermissionPresentInManifest(permission: String): Boolean {
    try {
      with(context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)) {
        if (requestedPermissions != null) {
          return requestedPermissions.contains(permission)
        }
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
    val askAsyncListener = mAskAsyncListener
    val askAsyncRequestedPermissionsTypes = mAskAsyncRequestedPermissionsTypes
    val askAsyncPermissionsTypesToBeAsked = mAskAsyncPermissionsTypesToBeAsked

    mAskAsyncListener = null
    mAskAsyncRequestedPermissionsTypes = null
    mAskAsyncPermissionsTypesToBeAsked = null

    // invoke actual asking for permissions
    mPermissionsAskedFor.addAll(askAsyncPermissionsTypesToBeAsked!!)
    askForPermissions(askAsyncPermissionsTypesToBeAsked.toTypedArray()) { askAsyncListener!!.onPermissionsResult(getPermissionsBundle(askAsyncRequestedPermissionsTypes)) }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit
}
