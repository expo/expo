package expo.modules.asset

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Resources
import java.io.InputStream

/**
 * Opens an Android resource as stream.
 */
internal fun openAssetResourceStream(context: Context, assetName: String): InputStream {
  val resources = context.resources
  val resId = findResourceId(context, assetName) ?: throw Resources.NotFoundException(assetName)
  return resources.openRawResource(resId)
}

@SuppressLint("DiscouragedApi")
private fun findResourceId(context: Context, assetName: String): Int? {
  val resources = context.resources
  val packageName = context.packageName
  // react-native core and expo-assets plugin will put resource in `res/raw` or `res/drawable`
  return resources.getIdentifier(assetName, "raw", packageName).takeIf { it != 0 }
    ?: resources.getIdentifier(assetName, "drawable", packageName).takeIf { it != 0 }
}
