package expo.modules.permissions

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import org.unimodules.core.interfaces.ActivityProvider

class AwareActivityDelegate(val activityProvider: ActivityProvider, val requestCode: Int) : ActivityDelegate {

  override fun getApplicationContext(): Context {
    return activityProvider.currentActivity.applicationContext
  }

  override fun canAskAgain(permission: String): Boolean {
    return activityProvider.currentActivity?.let {
      ActivityCompat.shouldShowRequestPermissionRationale(it, permission)
    } ?: false
  }

  override fun getPermission(permission: String): Int {
    activityProvider.currentActivity?.let {
      if (it is PermissionAwareActivity) {
        return ContextCompat.checkSelfPermission(it, permission)
      }
    }
    return PackageManager.PERMISSION_DENIED
  }

  override fun askForPermissions(permissions: Array<out String>, listener: PermissionListener) {
    activityProvider.currentActivity?.run {
      if (this is PermissionAwareActivity) {
        this.requestPermissions(permissions, requestCode, listener)
      } else {
        listener.onRequestPermissionsResult(requestCode, permissions, IntArray(permissions.size) { PackageManager.PERMISSION_DENIED })
      }
    }
  }
}

