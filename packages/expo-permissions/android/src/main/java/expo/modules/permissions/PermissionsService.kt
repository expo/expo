package expo.modules.permissions

import android.Manifest
import android.annotation.TargetApi
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.support.v4.content.ContextCompat

import com.facebook.react.modules.core.PermissionAwareActivity

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.UIManager
import org.unimodules.interfaces.permissions.Permissions
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsStatus

private const val PERMISSIONS_REQUEST: Int = 13
private const val PREFERENCE_FILENAME = "expo.modules.permissions.asked"

internal const val ERROR_TAG = "E_PERMISSIONS"

typealias PermissionsListener = (result: IntArray) -> Unit

class PermissionsService(val context: Context) : InternalModule, Permissions, LifecycleEventListener {
  private lateinit var mActivityProvider: ActivityProvider


  // state holders for asking for writing permissions
  private var mWritingPermissionBeingAsked = false // change this directly before calling corresponding startActivity
  private var mAskAsyncListener: PermissionsListener? = null
  private var mAskAsyncRequestedPermissions: Array<String>? = null

  private lateinit var mPermissionsAskedStorage: SharedPreferences

  fun didAsk(permission: String): Boolean = mPermissionsAskedStorage.getBoolean(permission, false)

  private fun addToAskedPreferences(permissions: List<String>) {
    with(mPermissionsAskedStorage.edit()) {
      permissions.forEach { putBoolean(it, true) }
      apply()
    }
  }

  override fun getExportedInterfaces(): List<Class<out Any>> = listOf(Permissions::class.java)

  @Throws(IllegalStateException::class)
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
        ?: throw IllegalStateException("Couldn't find implementation for ActivityProvider.")
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    mPermissionsAskedStorage = context.applicationContext.getSharedPreferences(PREFERENCE_FILENAME, Context.MODE_PRIVATE)
  }

  override fun getPermissionsWithPromise(promise: Promise, vararg permissions: String) {
    getPermissions(PermissionsResponse { permissionsMap: Map<String, PermissionsStatus> ->
      val allGranted = permissionsMap.all { (_, status) -> status == PermissionsStatus.GRANTED }
      val allDenied = permissionsMap.all { (_, status) -> status == PermissionsStatus.DENIED }
      promise.resolve(Bundle().apply {
        putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
        putString(PermissionsResponse.STATUS_KEY, when {
          allGranted -> PermissionsStatus.GRANTED.jsString
          allDenied -> PermissionsStatus.DENIED.jsString
          else -> PermissionsStatus.UNDETERMINED.jsString
        })
        putBoolean(PermissionsResponse.GRANTED_KEY, allGranted)
      })
    }, *permissions)
  }

  override fun askForPermissionsWithPromise(promise: Promise, vararg permissions: String) {
    askForPermissions(PermissionsResponse {
      getPermissionsWithPromise(promise, *permissions)
    }, *permissions)
  }


  override fun getPermissions(response: PermissionsResponse, vararg permissions: String) {
    val permissionsMap = HashMap<String, PermissionsStatus>()
    permissions.forEach {
      permissionsMap[it] = when {
        isPermissionGranted(it) -> PermissionsStatus.GRANTED
        didAsk(it) -> PermissionsStatus.DENIED
        else -> PermissionsStatus.UNDETERMINED
      }
    }
    response.onResult(permissionsMap)
  }

  override fun askForPermissions(response: PermissionsResponse, vararg permissions: String) {
    val permissionsToAsk = permissions.filter { !isPermissionGranted(it) }
    askForManifestPermissions(permissionsToAsk.toTypedArray()) {
      getPermissions(response, *permissions)
    }
  }

  override fun hasGrantedPermissions(vararg permissions: String): Boolean {
    return permissions.all { isPermissionGranted(it) }
  }

  /**
   * Checks whether given permission is present in AndroidManifest or not.
   */
  override fun isPermissionPresentInManifest(permission: String): Boolean {
    try {
      context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)?.run {
        return requestedPermissions.contains(permission)
      }
      return false
    } catch (e: PackageManager.NameNotFoundException) {
      return false
    }
  }

  /**
   * Checks status for Android built-in permission
   *
   * @param permission [android.Manifest.permission]
   */
  private fun isPermissionGranted(permission: String): Boolean {
    return when (permission) {
      // we need to handle this permission in different way
      Manifest.permission.WRITE_SETTINGS -> hasWritePermission()
      else -> getManifestPermission(permission) == PackageManager.PERMISSION_GRANTED
    }
  }

  /**
   * Gets status for Android built-in permission
   *
   * @param permission [android.Manifest.permission]
   */
  private fun getManifestPermission(permission: String): Int {
    mActivityProvider.currentActivity?.let {
      if (it is PermissionAwareActivity) {
        return ContextCompat.checkSelfPermission(it, permission)
      }
    }
    return PackageManager.PERMISSION_DENIED
  }

  /**
   * Asks for Android built-in permission
   * According to Android documentation [android.Manifest.permission.WRITE_SETTINGS] need to be handled in different way
   *
   * @param permission [android.Manifest.permission]
   */
  private fun askForManifestPermissions(permissions: Array<String>, listener: PermissionsListener) {
    addToAskedPreferences(permissions.toList())

    if (permissions.contains(Manifest.permission.WRITE_SETTINGS) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (mAskAsyncListener != null) {
        throw IllegalStateException("Different asking for permissions in progress. Await the old request and then try again.")
      }

      mAskAsyncListener = listener
      mAskAsyncRequestedPermissions = permissions
      askForWriteSettingsPermissionFirst()
      return
    }

    mActivityProvider.currentActivity?.run {
      if (this is PermissionAwareActivity) {
        this.requestPermissions(permissions, PERMISSIONS_REQUEST) { requestCode, receivePermissions, grantResults ->
          when (PERMISSIONS_REQUEST) {
            requestCode -> {
              listener(grantResults)
              true
            }
            else -> {
              listener(IntArray(receivePermissions.size) { PackageManager.PERMISSION_DENIED })
              false
            }
          }
        }
      } else {
        listener(IntArray(permissions.size) { PackageManager.PERMISSION_DENIED })
      }
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
      data = Uri.parse("package:${context.packageName}")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }.let {
      mWritingPermissionBeingAsked = true
      context.startActivity(it)
    }
  }

  private fun hasWritePermission(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Settings.System.canWrite(mActivityProvider.currentActivity.applicationContext)
    } else {
      true
    }
  }

  override fun onHostResume() {
    if (!mWritingPermissionBeingAsked) {
      return
    }
    mWritingPermissionBeingAsked = false

    // cleanup
    val askAsyncListener = mAskAsyncListener!!
    val askAsyncRequestedPermissions = mAskAsyncRequestedPermissions!!

    mAskAsyncListener = null
    mAskAsyncRequestedPermissions = null

    val permissionsToAsk = askAsyncRequestedPermissions.toMutableList().apply { remove(Manifest.permission.WRITE_SETTINGS) }.toTypedArray()


    // invoke actual asking for permissions
    askForManifestPermissions(permissionsToAsk) {
      // add to result WRITE_SETTINGS result
      askAsyncListener(it + getManifestPermission(Manifest.permission.WRITE_SETTINGS))
    }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit
}
