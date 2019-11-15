package expo.modules.permissions

import android.content.Context
import com.facebook.react.modules.core.PermissionListener

interface ActivityDelegate {

  fun askForPermissions(permissions: Array<out String>, listener: PermissionListener)

  fun getApplicationContext(): Context

  fun getPermission(permission: String): Int

  fun canAskAgain(permission: String): Boolean
}
