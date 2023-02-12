package abi47_0_0.expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.util.Log
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.errors.CurrentActivityNotFoundException
import abi47_0_0.expo.modules.core.interfaces.ActivityProvider
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod

class SystemUIModule(context: Context) : ExportedModule(context) {

  private lateinit var activityProvider: ActivityProvider

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    activityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
      ?: throw IllegalStateException("Could not find implementation for ActivityProvider.")
  }

  // Ensure that rejections are passed up to JS rather than terminating the native client.
  private fun safeRunOnUiThread(promise: Promise, block: (activity: Activity) -> Unit) {
    val activity = activityProvider.currentActivity
    if (activity == null) {
      promise.reject(CurrentActivityNotFoundException())
      return
    }
    activity.runOnUiThread {
      block(activity)
    }
  }

  @ExpoMethod
  fun setBackgroundColorAsync(color: Int, promise: Promise) {
    safeRunOnUiThread(promise) {
      var rootView = it.window.decorView
      var colorString = colorToHex(color)
      try {
        val color = Color.parseColor(colorString)
        rootView.setBackgroundColor(color)
        promise.resolve(null)
      } catch (e: Throwable) {
        Log.e(ERROR_TAG, e.toString())
        rootView.setBackgroundColor(Color.WHITE)
        promise.reject(ERROR_TAG, "Invalid color: \"$color\"")
      }
    }
  }

  @ExpoMethod
  fun getBackgroundColorAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      var mBackground = it.window.decorView.background
      if (mBackground is ColorDrawable) {
        promise.resolve(colorToHex((mBackground.mutate() as ColorDrawable).color))
      } else {
        promise.resolve(null)
      }
    }
  }

  companion object {
    private const val NAME = "ExpoSystemUI"
    private const val ERROR_TAG = "ERR_SYSTEM_UI"

    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
