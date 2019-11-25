package expo.modules.permissions

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import org.unimodules.core.interfaces.ActivityProvider

class PermissionsAwareActivityDelegate(val activityProvider: ActivityProvider, val requestCode: Int) : PermissionsActivityDelegate {

  override fun getApplicationContext(): Context? {
    return activityProvider.currentActivity?.applicationContext
  }

  override fun canAskAgain(permission: String): Boolean {
    return activityProvider.currentActivity?.let {
      ActivityCompat.shouldShowRequestPermissionRationale(it, permission)
    } ?: false
  }

  override fun getPermission(permission: String): Int {
    return activityProvider.currentActivity?.let {
      if (it is PermissionAwareActivity) {
        ContextCompat.checkSelfPermission(it, permission)
      } else {
        PackageManager.PERMISSION_DENIED
      }
    } ?: PackageManager.PERMISSION_DENIED
  }

  override fun askForPermissions(permissions: Array<out String>, listener: PermissionListener) {
    activityProvider.currentActivity?.let {
      if (it is PermissionAwareActivity) {
        it.requestPermissions(permissions, requestCode, listener)
      } else {
        listener.onRequestPermissionsResult(requestCode, permissions, IntArray(permissions.size) { PackageManager.PERMISSION_DENIED })
      }
    }
  }
}

