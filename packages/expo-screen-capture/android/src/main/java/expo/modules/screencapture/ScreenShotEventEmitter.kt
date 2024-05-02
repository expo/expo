package expo.modules.screencapture

import android.Manifest.permission
import android.content.Context
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Log
import androidx.annotation.Nullable
import androidx.core.content.ContextCompat
import expo.modules.core.interfaces.LifecycleEventListener

class ScreenshotEventEmitter(val context: Context, onCapture: () -> Unit) : LifecycleEventListener {
  private var isListening: Boolean = true
  private var previousPath: String = ""

  private val contentObserver: ContentObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
    override fun onChange(selfChange: Boolean, uri: Uri?) {
      super.onChange(selfChange, uri)
      if (isListening) {
        if (!hasPermissions(context)) {
          Log.e("expo-screen-capture", "Could not listen for screenshots, do not have READ_EXTERNAL_STORAGE permission.")
          return
        }
        val path = getFilePathFromContentResolver(context, uri)
        if (path != null && isPathOfNewScreenshot(path)) {
          previousPath = path
          onCapture()
        }
      }
    }
  }

  init {
    context.contentResolver.registerContentObserver(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true, contentObserver)
  }

  override fun onHostResume() {
    isListening = true
  }

  override fun onHostPause() {
    isListening = false
  }

  override fun onHostDestroy() {
    context.contentResolver.unregisterContentObserver(contentObserver)
  }

  private fun hasPermissions(context: Context): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return ContextCompat.checkSelfPermission(context, permission.DETECT_SCREEN_CAPTURE) == PackageManager.PERMISSION_GRANTED
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      return ContextCompat.checkSelfPermission(context, permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED
    }
    return ContextCompat.checkSelfPermission(context, permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
  }

  @Nullable
  private fun getFilePathFromContentResolver(context: Context, uri: Uri?): String? {
    if (uri == null) {
      return null
    }
    try {
      val cursor = context.contentResolver.query(uri, arrayOf(MediaStore.Images.Media.DATA), null, null, null)
      if (cursor != null && cursor.moveToFirst()) {
        val index = cursor.getColumnIndex(MediaStore.Images.Media.DATA)
        val path = cursor.getString(index)
        cursor.close()
        return path
      }
    } catch (err: Exception) {
      Log.e("expo-screen-capture", "Error retrieving filepath: $err")
    }
    return null
  }

  private fun isPathOfNewScreenshot(path: String): Boolean {
    // Ignore paths that are not screenshots and pending screenshots
    if (!path.lowercase().contains("screenshot") || path.lowercase().contains(".pending")) {
      return false
    }
    // Cannot check that the onChange event is for an insert operation until API level 30
    // Instead, we save the last path and check if this is a duplicate, since each subsequent
    // screenshot will have a new path
    if (previousPath.isEmpty()) {
      return true
    }
    return path.compareTo(previousPath) != 0
  }
}
