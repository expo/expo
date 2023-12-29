package host.exp.exponent.utils

import android.Manifest
import android.app.AlertDialog
import android.content.DialogInterface
import android.content.pm.PackageManager
import android.provider.Settings
import com.facebook.react.modules.core.PermissionListener
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry
import host.exp.expoview.Exponent
import host.exp.expoview.R
import javax.inject.Inject

class ScopedPermissionsRequester(private val experienceKey: ExperienceKey) {
  @Inject
  lateinit var expoKernelServiceRegistry: ExpoKernelServiceRegistry

  private var permissionListener: PermissionListener? = null
  private var experienceName: String? = null
  private var permissionsResult = mutableMapOf<String, Int>()
  private val permissionsToRequestPerExperience = mutableListOf<String>()
  private val permissionsToRequestGlobally = mutableListOf<String>()
  private var permissionsAskedCount = 0

  fun requestPermissions(
    currentActivity: ReactNativeActivity,
    experienceName: String?,
    permissions: Array<String>,
    listener: PermissionListener
  ) {
    permissionListener = listener
    this.experienceName = experienceName
    permissionsResult = mutableMapOf()

    for (permission in permissions) {
      if (permission == null) {
        continue
      }
      val globalStatus = currentActivity.checkSelfPermission(permission)
      if (globalStatus == PackageManager.PERMISSION_DENIED) {
        permissionsToRequestGlobally.add(permission)
      } else if (!expoKernelServiceRegistry.permissionsKernelService.hasGrantedPermissions(
          permission,
          experienceKey
        )
      ) {
        permissionsToRequestPerExperience.add(permission)
      } else {
        permissionsResult[permission] = PackageManager.PERMISSION_GRANTED
      }
    }

    if (permissionsToRequestPerExperience.isEmpty() && permissionsToRequestGlobally.isEmpty()) {
      callPermissionsListener()
      return
    }

    permissionsAskedCount = permissionsToRequestPerExperience.size

    if (permissionsToRequestPerExperience.isNotEmpty()) {
      requestExperienceAndGlobalPermissions(permissionsToRequestPerExperience[permissionsAskedCount - 1])
    } else if (permissionsToRequestGlobally.isNotEmpty()) {
      currentActivity.requestPermissions(
        permissionsToRequestGlobally.toTypedArray(),
        EXPONENT_PERMISSIONS_REQUEST
      )
    }
  }

  fun onRequestPermissionsResult(permissions: Array<String>, grantResults: IntArray): Boolean {
    if (permissionListener == null) {
      // sometimes onRequestPermissionsResult is called multiple times if the first permission
      // is rejected...
      return true
    }

    if (grantResults.isNotEmpty()) {
      for (i in grantResults.indices) {
        if (grantResults[i] == PackageManager.PERMISSION_GRANTED) {
          expoKernelServiceRegistry.permissionsKernelService.grantScopedPermissions(
            permissions[i],
            experienceKey
          )
        }
        permissionsResult[permissions[i]] = grantResults[i]
      }
    }

    return callPermissionsListener()
  }

  private fun callPermissionsListener(): Boolean {
    val permissions = permissionsResult.keys.toTypedArray()
    val result = IntArray(permissions.size)
    for (i in permissions.indices) {
      result[i] = permissionsResult[permissions[i]]!!
    }
    return permissionListener!!.onRequestPermissionsResult(
      EXPONENT_PERMISSIONS_REQUEST,
      permissions,
      result
    )
  }

  private fun requestExperienceAndGlobalPermissions(permission: String) {
    val activity = Exponent.instance.currentActivity
    val builder = AlertDialog.Builder(activity)
    val onClickListener = PermissionsDialogOnClickListener(permission)
    builder
      .setMessage(
        activity!!.getString(
          R.string.experience_needs_permissions,
          experienceName,
          activity.getString(permissionToResId(permission))
        )
      )
      .setPositiveButton(R.string.allow_experience_permissions, onClickListener)
      .setNegativeButton(R.string.deny_experience_permissions, onClickListener)
      .show()
  }

  private fun permissionToResId(permission: String): Int {
    return when (permission) {
      Manifest.permission.CAMERA -> R.string.perm_camera
      Manifest.permission.READ_CONTACTS -> R.string.perm_contacts_read
      Manifest.permission.WRITE_CONTACTS -> R.string.perm_contacts_write
      Manifest.permission.READ_EXTERNAL_STORAGE -> R.string.perm_camera_roll_read
      Manifest.permission.WRITE_EXTERNAL_STORAGE -> R.string.perm_camera_roll_write
      Manifest.permission.ACCESS_MEDIA_LOCATION -> R.string.perm_access_media_location
      Manifest.permission.RECORD_AUDIO -> R.string.perm_audio_recording
      Settings.ACTION_MANAGE_WRITE_SETTINGS -> R.string.perm_system_brightness
      Manifest.permission.READ_CALENDAR -> R.string.perm_calendar_read
      Manifest.permission.WRITE_CALENDAR -> R.string.perm_calendar_write
      Manifest.permission.ACCESS_FINE_LOCATION -> R.string.perm_fine_location
      Manifest.permission.ACCESS_COARSE_LOCATION -> R.string.perm_coarse_location
      Manifest.permission.ACCESS_BACKGROUND_LOCATION -> R.string.perm_background_location
      Manifest.permission.READ_PHONE_STATE -> R.string.perm_read_phone_state
      Manifest.permission.READ_MEDIA_IMAGES -> R.string.perm_read_media_images
      Manifest.permission.READ_MEDIA_VIDEO -> R.string.perm_read_media_videos
      Manifest.permission.READ_MEDIA_AUDIO -> R.string.perm_read_media_audio
      Manifest.permission.POST_NOTIFICATIONS -> R.string.perm_notifications
      else -> -1
    }
  }

  private inner class PermissionsDialogOnClickListener(private val permission: String) : DialogInterface.OnClickListener {
    override fun onClick(dialog: DialogInterface, which: Int) {
      permissionsAskedCount -= 1
      when (which) {
        DialogInterface.BUTTON_POSITIVE -> {
          expoKernelServiceRegistry.permissionsKernelService.grantScopedPermissions(
            permission,
            this@ScopedPermissionsRequester.experienceKey
          )
          permissionsResult[permission] = PackageManager.PERMISSION_GRANTED
        }
        DialogInterface.BUTTON_NEGATIVE -> {
          expoKernelServiceRegistry.permissionsKernelService.revokeScopedPermissions(
            permission,
            experienceKey
          )
          permissionsResult[permission] = PackageManager.PERMISSION_DENIED
        }
      }

      if (permissionsAskedCount > 0) {
        requestExperienceAndGlobalPermissions(permissionsToRequestPerExperience[permissionsAskedCount - 1])
      } else if (permissionsToRequestGlobally.isNotEmpty()) {
        Exponent.instance.currentActivity!!.requestPermissions(
          permissionsToRequestGlobally.toTypedArray(),
          EXPONENT_PERMISSIONS_REQUEST
        )
      } else {
        callPermissionsListener()
      }
    }
  }

  companion object {
    const val EXPONENT_PERMISSIONS_REQUEST = 13
  }

  init {
    NativeModuleDepsProvider.instance.inject(ScopedPermissionsRequester::class.java, this)
  }
}
