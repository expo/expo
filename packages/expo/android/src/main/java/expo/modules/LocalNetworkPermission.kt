package expo.modules

import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.common.build.ReactBuildConfig

// Android 17 blocks dev server traffic until the app holds the permission React Native's debug manifest declares.
internal object LocalNetworkPermission {
  const val PERMISSION = "android.permission.ACCESS_LOCAL_NETWORK"
  const val REQUEST_CODE = 0x4c4e

  private const val FIRST_ENFORCED_SDK = 37

  fun shouldRequest(activity: Activity): Boolean =
    ReactBuildConfig.DEBUG &&
      Build.VERSION.SDK_INT >= FIRST_ENFORCED_SDK &&
      activity.checkSelfPermission(PERMISSION) != PackageManager.PERMISSION_GRANTED
}
