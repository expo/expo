package expo.modules.asset

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Resources
import androidx.core.net.toUri
import expo.modules.core.errors.InvalidArgumentException
import java.io.InputStream

internal const val ANDROID_EMBEDDED_URL_BASE_RESOURCE = "file:///android_res/"

/**
 * Opens an Android resource as stream.
 */
internal fun openAssetResourceStream(context: Context, assetName: String): InputStream {
  val resId = findResourceId(context, assetName) ?: throw Resources.NotFoundException(assetName)
  return context.resources.openRawResource(resId)
}

/**
 * Opens an Android resource as stream for `file:///android_res/` format
 */
internal fun openAndroidResStream(context: Context, resourceFilePath: String): InputStream {
  val resId = findResourceIdForAndroidResPath(context, resourceFilePath)
    ?: throw Resources.NotFoundException(resourceFilePath)
  return context.resources.openRawResource(resId)
}

@SuppressLint("DiscouragedApi")
private fun findResourceId(context: Context, assetName: String): Int? {
  val resources = context.resources
  val packageName = context.packageName
  // react-native core and expo-assets plugin will put resource in `res/raw` or `res/drawable`
  return resources.getIdentifier(assetName, "raw", packageName).takeIf { it != 0 }
    ?: resources.getIdentifier(assetName, "drawable", packageName).takeIf { it != 0 }
}

@SuppressLint("DiscouragedApi")
private fun findResourceIdForAndroidResPath(context: Context, resourceFilePath: String): Int? {
  if (!resourceFilePath.startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
    throw InvalidArgumentException("Invalid resource file path: $resourceFilePath")
  }
  val uri = resourceFilePath.toUri()
  val pathSegments = uri.pathSegments
  if (pathSegments.size < 3) {
    throw InvalidArgumentException("Invalid resource file path: $resourceFilePath")
  }

  // Strip any qualifiers after a dash, for example "drawable-xhdpi" becomes "drawable"
  val resourceDirectory = pathSegments[1].substringBefore('-')

  // Strip file extension for resource name
  val resourceFilename = pathSegments[2]
  val resourceName = resourceFilename.substringBeforeLast('.', resourceFilename)

  return context.resources.getIdentifier(
    resourceName,
    resourceDirectory,
    context.packageName
  ).takeIf { it != 0 }
}
