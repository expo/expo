package expo.modules.adapters.react.permissions

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus
import java.util.*

private const val PERMISSIONS_REQUEST: Int = 13
private const val PREFERENCE_FILENAME = "expo.modules.permissions.asked"

open class PermissionsService(val context: Context) : InternalModule, Permissions, LifecycleEventListener {
  private var mActivityProvider: ActivityProvider? = null

  // state holders for asking for writing permissions
  private var mWriteSettingsPermissionBeingAsked = false // change this directly before calling corresponding startActivity
  private var mAskAsyncListener: PermissionsResponseListener? = null
  private var mAskAsyncRequestedPermissions: Array<String>? = null

  private val mPendingPermissionCalls: Queue<Pair<Array<String>, PermissionsResponseListener>> = LinkedList()
  private var mCurrentPermissionListener: PermissionsResponseListener? = null

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

  override fun getPermissionsWithPromise(
    promise:
    @Suppress("DEPRECATION")
    expo.modules.core.Promise,
    vararg permissions: String
  ) {
    getPermissions(
      PermissionsResponseListener { permissionsMap: MutableMap<String, PermissionsResponse> ->
        val areAllGranted = permissionsMap.all { (_, response) -> response.status == PermissionsStatus.GRANTED }
        val areAllDenied = permissionsMap.isNotEmpty() && permissionsMap.all { (_, response) -> response.status == PermissionsStatus.DENIED }
        val canAskAgain = permissionsMap.all { (_, response) -> response.canAskAgain }

        promise.resolve(
          Bundle().apply {
            putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
            putString(
              PermissionsResponse.STATUS_KEY,
              when {
                areAllGranted -> PermissionsStatus.GRANTED.status
                areAllDenied -> PermissionsStatus.DENIED.status
                else -> PermissionsStatus.UNDETERMINED.status
              }
            )
            putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
            putBoolean(PermissionsResponse.GRANTED_KEY, areAllGranted)
          }
        )
      },
      *permissions
    )
  }

  override fun askForPermissionsWithPromise(
    promise:
    @Suppress("DEPRECATION")
    expo.modules.core.Promise,
    vararg permissions: String
  ) {
    askForPermissions(
      PermissionsResponseListener {
        getPermissionsWithPromise(promise, *permissions)
      },
      *permissions
    )
  }

  override fun getPermissions(responseListener: PermissionsResponseListener, vararg permissions: String) {
    responseListener.onResult(
      parseNativeResult(
        permissions,
        permissions.map {
          if (isPermissionGranted(it)) {
            PackageManager.PERMISSION_GRANTED
          } else {
            PackageManager.PERMISSION_DENIED
          }
        }.toIntArray()
      )
    )
  }

  @Throws(IllegalStateException::class)
  override fun askForPermissions(responseListener: PermissionsResponseListener, vararg permissions: String) {
    if (permissions.isEmpty()) {
      responseListener.onResult(mutableMapOf())
      return
    }

    if (permissions.contains(Manifest.permission.WRITE_SETTINGS)) {
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
        // User only ask for `WRITE_SETTINGS`, we can already return response
        if (permissionsToAsk.isEmpty()) {
          newListener.onResult(mutableMapOf())
          return
        }
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
        return requestedPermissions!!.contains(permission)
      }
      return false
    } catch (_: PackageManager.NameNotFoundException) {
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

    // We are in the headless mode. So, we ask current context.
    return getManifestPermissionFromContext(permission)
  }

  protected open fun getManifestPermissionFromContext(permission: String): Int {
    return ContextCompat.checkSelfPermission(context, permission)
  }

  private fun canAskAgain(permission: String): Boolean {
    return mActivityProvider?.currentActivity?.let {
      ActivityCompat.shouldShowRequestPermissionRationale(it, permission)
    } == true
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
    delegateRequestToActivity(arrayOf(*permissions), listener)
  }

  /**
   * Asks for Android built-in permission
   * According to Android documentation [android.Manifest.permission.WRITE_SETTINGS] need to be handled in different way
   *
   * @param permissions [android.Manifest.permission]
   */
  protected fun delegateRequestToActivity(permissions: Array<String>, listener: PermissionsResponseListener) {
    addToAskedPermissionsCache(permissions)

    val currentActivity = mActivityProvider?.currentActivity
    if (currentActivity is PermissionAwareActivity) {
      synchronized(this@PermissionsService) {
        if (mCurrentPermissionListener != null) {
          mPendingPermissionCalls.add(permissions to listener)
        } else {
          mCurrentPermissionListener = listener
          currentActivity.requestPermissions(permissions, PERMISSIONS_REQUEST, createListenerWithPendingPermissionsRequest())
        }
      }
    } else {
      listener.onResult(parseNativeResult(permissions, IntArray(permissions.size) { PackageManager.PERMISSION_DENIED }))
    }
  }

  private fun createListenerWithPendingPermissionsRequest(): PermissionListener {
    return PermissionListener { requestCode, receivePermissions, grantResults ->
      if (requestCode == PERMISSIONS_REQUEST) {
        synchronized(this@PermissionsService) {
          val currentListener = requireNotNull(mCurrentPermissionListener)
          currentListener.onResult(parseNativeResult(receivePermissions, grantResults))
          mCurrentPermissionListener = null

          mPendingPermissionCalls.poll()?.let { pendingCall ->
            val activity = mActivityProvider?.currentActivity as? PermissionAwareActivity
            if (activity == null) {
              // clear all pending calls, because we don't have access to the activity instance
              pendingCall.second.onResult(parseNativeResult(pendingCall.first, IntArray(pendingCall.first.size) { PackageManager.PERMISSION_DENIED }))
              mPendingPermissionCalls.forEach {
                it.second.onResult(parseNativeResult(it.first, IntArray(it.first.size) { PackageManager.PERMISSION_DENIED }))
              }
              mPendingPermissionCalls.clear()
              return@let
            }

            mCurrentPermissionListener = pendingCall.second
            activity.requestPermissions(pendingCall.first, PERMISSIONS_REQUEST, createListenerWithPendingPermissionsRequest())
            return@PermissionListener false
          }

          return@PermissionListener true
        }
      }
      return@PermissionListener false
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
    return Settings.System.canWrite(context.applicationContext)
  }

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

    if (askAsyncRequestedPermissions.isNotEmpty()) {
      // invoke actual asking for permissions
      askForManifestPermissions(askAsyncRequestedPermissions, askAsyncListener)
    } else {
      // user asked only for Manifest.permission.WRITE_SETTINGS
      askAsyncListener.onResult(mutableMapOf())
    }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit
}
