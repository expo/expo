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
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

import com.facebook.react.modules.core.PermissionAwareActivity

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.UIManager
import org.unimodules.interfaces.permissions.Permissions
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponseListener
import org.unimodules.interfaces.permissions.PermissionsStatus

private const val PERMISSIONS_REQUEST: Int = 13
private const val PREFERENCE_FILENAME = "expo.modules.permissions.asked"

internal const val ERROR_TAG = "E_PERMISSIONS"

open class PermissionsService(val context: Context) : InternalModule, Permissions, LifecycleEventListener {
  private var mActivityProvider: ActivityProvider? = null


  // state holders for asking for writing permissions
  private var mWriteSettingsPermissionBeingAsked = false // change this directly before calling corresponding startActivity
  private var mAskAsyncListener: PermissionsResponseListener? = null
  private var mAskAsyncRequestedPermissions: Array<out String>? = null

  private lateinit var mAskedPermissionsCache: SharedPreferences

  private fun didAsk(permission: String): Boolean = mAskedPermissionsCache.getBoolean(permission, false)

  private fun addToAskedPermissionsCache(permissions: Array<out String>) {
    with(mAskedPermissionsCache.edit()) {
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
    mAskedPermissionsCache = context.applicationContext.getSharedPreferences(PREFERENCE_FILENAME, Context.MODE_PRIVATE)
  }

  override fun getPermissionsWithPromise(promise: Promise, vararg permissions: String) {
    getPermissions(PermissionsResponseListener { permissionsMap: MutableMap<String, PermissionsResponse> ->
      val areAllGranted = permissionsMap.all { (_, response) -> response.status == PermissionsStatus.GRANTED }
      val areAllDenied = permissionsMap.all { (_, response) -> response.status == PermissionsStatus.DENIED }
      val canAskAgain = permissionsMap.all { (_, response) -> response.canAskAgain }

      promise.resolve(Bundle().apply {
        putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
        putString(PermissionsResponse.STATUS_KEY, when {
          areAllGranted -> PermissionsStatus.GRANTED.status
          areAllDenied -> PermissionsStatus.DENIED.status
          else -> PermissionsStatus.UNDETERMINED.status
        })
        putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
        putBoolean(PermissionsResponse.GRANTED_KEY, areAllGranted)
      })
    }, *permissions)
  }

  override fun askForPermissionsWithPromise(promise: Promise, vararg permissions: String) {
    askForPermissions(PermissionsResponseListener {
      getPermissionsWithPromise(promise, *permissions)
    }, *permissions)
  }


  override fun getPermissions(responseListener: PermissionsResponseListener, vararg permissions: String) {
    responseListener.onResult(parseNativeResult(permissions, permissions.map {
      if (isPermissionGranted(it)) {
        PackageManager.PERMISSION_GRANTED
      } else {
        PackageManager.PERMISSION_DENIED
      }
    }.toIntArray()))
  }

  @Throws(IllegalStateException::class)
  override fun askForPermissions(responseListener: PermissionsResponseListener, vararg permissions: String) {
    if (permissions.contains(Manifest.permission.WRITE_SETTINGS) && isRuntimePermissionsAvailable()) {
      val permissionsToAsk = permissions.toMutableList().apply { remove(Manifest.permission.WRITE_SETTINGS) }.toTypedArray()
      val newListener = PermissionsResponseListener {
        val status = if (hasWriteSettingsPermission()) {
          PackageManager.PERMISSION_GRANTED
        } else {
          PackageManager.PERMISSION_DENIED
        }

        it[Manifest.permission.WRITE_SETTINGS] = getPermissionResponseFromNativeResponse(Manifest.permission.WRITE_SETTINGS, status)
        responseListener.onResult(it)
      }

      if (!hasWriteSettingsPermission()) {
        if (mAskAsyncListener != null) {
          throw IllegalStateException("Another permissions request is in progress. Await the old request and then try again.")
        }
        mAskAsyncListener = newListener
        mAskAsyncRequestedPermissions = permissionsToAsk

        addToAskedPermissionsCache(arrayOf(Manifest.permission.WRITE_SETTINGS))
        askForWriteSettingsPermissionFirst()
      } else {
        askForManifestPermissions(permissionsToAsk, newListener)
      }
    } else {
      askForManifestPermissions(permissions, responseListener)
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
      Manifest.permission.WRITE_SETTINGS -> hasWriteSettingsPermission()
      else -> getManifestPermission(permission) == PackageManager.PERMISSION_GRANTED
    }
  }

  /**
   * Gets status for Android built-in permission
   *
   * @param permission [android.Manifest.permission]
   */
  private fun getManifestPermission(permission: String): Int {
    mActivityProvider?.currentActivity?.let {
      if (it is PermissionAwareActivity) {
        return ContextCompat.checkSelfPermission(it, permission)
      }
    }
    return PackageManager.PERMISSION_DENIED
  }

  private fun canAskAgain(permission: String): Boolean {
    return mActivityProvider?.currentActivity?.let {
      ActivityCompat.shouldShowRequestPermissionRationale(it, permission)
    } ?: false
  }

  private fun parseNativeResult(permissionsString: Array<out String>, grantResults: IntArray): Map<String, PermissionsResponse> {
    return HashMap<String, PermissionsResponse>().apply {
      grantResults.zip(permissionsString).forEach { (result, permission) ->
        this[permission] = getPermissionResponseFromNativeResponse(permission, result)
      }
    }
  }

  private fun getPermissionResponseFromNativeResponse(permission: String, result: Int): PermissionsResponse {
    val status = when {
      result == PackageManager.PERMISSION_GRANTED -> PermissionsStatus.GRANTED
      didAsk(permission) -> PermissionsStatus.DENIED
      else -> PermissionsStatus.UNDETERMINED
    }
    return PermissionsResponse(
      status,
      if (status == PermissionsStatus.DENIED) {
        canAskAgain(permission)
      } else {
        true
      }
    )
  }

  protected open fun askForManifestPermissions(permissions: Array<out String>, listener: PermissionsResponseListener) {
    if (!isRuntimePermissionsAvailable()) {
      // It's not possible to ask for the permissions in the runtime.
      // We return to the user the permissions status, which was granted during installation.
      addToAskedPermissionsCache(permissions)
      val permissionsResult = permissions.map { getManifestPermission(it) }.toIntArray()
      listener.onResult(parseNativeResult(permissions, permissionsResult))
      return
    }

    delegateRequestToActivity(permissions, listener)
  }

  /**
   * Asks for Android built-in permission
   * According to Android documentation [android.Manifest.permission.WRITE_SETTINGS] need to be handled in different way
   *
   * @param permissions [android.Manifest.permission]
   */
  protected fun delegateRequestToActivity(permissions: Array<out String>, listener: PermissionsResponseListener) {
    addToAskedPermissionsCache(permissions)

    mActivityProvider?.currentActivity?.run {
      if (this is PermissionAwareActivity) {
        requestPermissions(permissions, PERMISSIONS_REQUEST) { requestCode, receivePermissions, grantResults ->
          return@requestPermissions if (requestCode == PERMISSIONS_REQUEST) {
            listener.onResult(parseNativeResult(receivePermissions, grantResults))
            true
          } else {
            listener.onResult(parseNativeResult(receivePermissions, IntArray(receivePermissions.size) { PackageManager.PERMISSION_DENIED }))
            false
          }
        }
      } else {
        listener.onResult(parseNativeResult(permissions, IntArray(permissions.size) { PackageManager.PERMISSION_DENIED }))
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
      mWriteSettingsPermissionBeingAsked = true
      context.startActivity(it)
    }
  }

  private fun hasWriteSettingsPermission(): Boolean {
    return if (isRuntimePermissionsAvailable()) {
      Settings.System.canWrite(mActivityProvider!!.currentActivity.applicationContext)
    } else {
      true
    }
  }

  private fun isRuntimePermissionsAvailable() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M

  override fun onHostResume() {
    if (!mWriteSettingsPermissionBeingAsked) {
      return
    }
    mWriteSettingsPermissionBeingAsked = false

    // cleanup
    val askAsyncListener = mAskAsyncListener!!
    val askAsyncRequestedPermissions = mAskAsyncRequestedPermissions!!

    mAskAsyncListener = null
    mAskAsyncRequestedPermissions = null

    // invoke actual asking for permissions
    askForManifestPermissions(askAsyncRequestedPermissions, askAsyncListener)
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit
}
