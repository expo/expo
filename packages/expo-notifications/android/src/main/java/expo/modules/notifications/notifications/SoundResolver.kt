package expo.modules.notifications.notifications

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.provider.Settings

/**
 * A shared logic between ContentBuilders ([ArgumentsNotificationContentBuilder]
 * and [RemoteNotificationContent]) for resolving sounds based on the "soundName" property.
 */
class SoundResolver(private val context: Context) {
  /**
   * For given filename tries to resolve a raw resource by basename.
   *
   * @param filename A sound's filename
   * @return null if there was no sound found for the filename or a [Uri] to the raw resource
   * if one could be found.
   */
  fun resolve(filename: String?): Uri? {
    if (filename.isNullOrEmpty()) {
      return null
    }

    val packageName = context.packageName
    val resourceName = filenameToBasename(filename)
    val resourceId = context.resources.getIdentifier(resourceName, "raw", packageName)
    // If resourceId is 0, then the resource does not exist.
    // Returning null falls back to using a default sound.
    if (resourceId != 0) {
      return Uri.Builder()
        .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
        .authority(packageName)
        .appendPath("raw")
        .appendPath(resourceName)
        .build()
    }

    return Settings.System.DEFAULT_NOTIFICATION_URI
  }

  fun resourceExists(filename: String?): Boolean {
    if (filename.isNullOrEmpty()) {
      return false
    }
    val packageName = context.packageName
    val resourceName = filenameToBasename(filename)
    val resourceId = context.resources.getIdentifier(resourceName, "raw", packageName)
    return resourceId != 0
  }

  private fun filenameToBasename(filename: String): String {
    if (!filename.contains(".")) {
      return filename
    }

    return filename.substring(0, filename.lastIndexOf('.'))
  }
}
