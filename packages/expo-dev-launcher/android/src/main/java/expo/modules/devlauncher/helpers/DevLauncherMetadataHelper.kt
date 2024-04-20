package expo.modules.devlauncher.helpers

import android.content.Context
import android.content.pm.PackageManager

object DevLauncherMetadataHelper {
  fun getMetadataValue(context: Context, key: String, defaultValue: String = ""): String {
    val packageManager = context.packageManager
    val packageName = context.packageName
    val applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
    var metaDataValue = if (applicationInfo.metaData != null) {
      applicationInfo.metaData.getString(key, defaultValue)
    } else {
      defaultValue
    }

    return metaDataValue
  }
}
