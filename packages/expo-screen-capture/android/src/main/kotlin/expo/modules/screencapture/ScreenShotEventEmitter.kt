package expo.modules.screencapture

import android.Manifest.permission
import android.content.Context
import android.content.ContentResolver
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.provider.MediaStore
import android.util.Log

import androidx.core.content.ContextCompat
import androidx.annotation.NonNull
import androidx.annotation.Nullable

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.EventEmitter
import org.unimodules.core.interfaces.services.UIManager

import java.lang.Exception

class ScreenshotEventEmitter(val context: Context, moduleRegistry: ModuleRegistry) : LifecycleEventListener {
  private val onScreenShotEventName: String = "onScreenShot"
  private var isListening: Boolean = true
  private lateinit var eventEmitter: EventEmitter

  init {
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)

    var contentObserver: ContentObserver = object : ContentObserver(Handler()) {
      override fun onChange(selfChange: Boolean, uri: Uri) {
        super.onChange(selfChange, uri)
        if (isListening) {
          if (!hasReadExternalStoragePermission(context)) {
            Log.e("expo-screen-capture", "Could not listen for screenshots, do not have READ_EXTERNAL_STORAGE permission.")
            return
          }
          val path = getFilePathFromContentResolver(context, uri)
          if (pathIndicatesScreenshot(path)) {
            eventEmitter.emit(onScreenShotEventName, Bundle())
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

  private @Nullable fun getFilePathFromContentResolver(context: Context, uri: Uri): String? {
    try {
      val cursor = context.contentResolver.query(uri, arrayOf(MediaStore.Images.Media.DATA), null, null, null)
      if (cursor != null && cursor.moveToFirst()) {
        val path = cursor.getString(cursor.getColumnIndex(MediaStore.Images.Media.DATA))
        cursor.close()
        return path
      }
    } catch (err: Exception) {
      Log.e("expo-screen-capture", "Error retrieving filepath: " + err)
    }
    return null
  }

  private fun pathIndicatesScreenshot(path: String?): Boolean {
    return path != null && path.toLowerCase().contains("screenshot")
  }
}
