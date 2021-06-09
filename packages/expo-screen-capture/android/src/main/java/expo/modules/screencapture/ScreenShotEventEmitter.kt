package expo.modules.screencapture

import android.Manifest.permission
import android.content.Context
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.provider.MediaStore
import android.util.Log

import androidx.core.content.ContextCompat
import androidx.annotation.Nullable

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.EventEmitter
import org.unimodules.core.interfaces.services.UIManager

import java.lang.Exception

class ScreenshotEventEmitter(val context: Context, moduleRegistry: ModuleRegistry) : LifecycleEventListener {
  private val onScreenshotEventName: String = "onScreenshot"
  private var isListening: Boolean = true
  private var eventEmitter: EventEmitter
  private var previousPath: String = ""

  init {
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)

    val contentObserver: ContentObserver = object : ContentObserver(Handler()) {
      override fun onChange(selfChange: Boolean, uri: Uri?) {
        super.onChange(selfChange, uri)
        if (isListening) {
          if (!hasReadExternalStoragePermission(context)) {
            Log.e("expo-screen-capture", "Could not listen for screenshots, do not have READ_EXTERNAL_STORAGE permission.")
            return
          }
          val path = getFilePathFromContentResolver(context, uri)
          if (path != null && isPathOfNewScreenshot(path)) {
            previousPath = path
            eventEmitter.emit(onScreenshotEventName, Bundle())
          }
        }
      }
    }
    context.contentResolver.registerContentObserver(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true, contentObserver)
  }

  override fun onHostResume() {
    isListening = true
  }

  override fun onHostPause() {
    isListening = false
  }

  override fun onHostDestroy() {
    // Do nothing
  }

  private fun hasReadExternalStoragePermission(context: Context): Boolean {
    return ContextCompat.checkSelfPermission(context, permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
  }

  @Nullable private fun getFilePathFromContentResolver(context: Context, uri: Uri?): String? {
    if (uri == null) {
      return null
    }
    try {
      val cursor = context.contentResolver.query(uri, arrayOf(MediaStore.Images.Media.DATA), null, null, null)
      if (cursor != null && cursor.moveToFirst()) {
        val path = cursor.getString(cursor.getColumnIndex(MediaStore.Images.Media.DATA))
        cursor.close()
        return path
      }
    } catch (err: Exception) {
      Log.e("expo-screen-capture", "Error retrieving filepath: $err")
    }
    return null
  }

  private fun isPathOfNewScreenshot(path: String): Boolean {
    if (!path.toLowerCase().contains("screenshot")) {
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
