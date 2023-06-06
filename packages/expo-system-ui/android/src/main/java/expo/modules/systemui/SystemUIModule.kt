package expo.modules.systemui

import android.content.Context
import android.content.SharedPreferences
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SystemUIModule : Module() {
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val prefs: SharedPreferences
    get() = context.getSharedPreferences("expo_ui_preferences", Context.MODE_PRIVATE)
      ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoSystemUI")

    AsyncFunction("setBackgroundColorAsync") { color: Int ->
      prefs.edit()
        .putInt("backgroundColor", color)
        .apply()
      setBackgroundColor(color)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getBackgroundColorAsync") {
      val background = currentActivity.window.decorView.background
      return@AsyncFunction if (background is ColorDrawable) {
        colorToHex((background.mutate() as ColorDrawable).color)
      } else {
        null
      }
    }

    AsyncFunction("restoreBackgroundColorAsync") {
      val colorInt = prefs.getInt("backgroundColor", Color.WHITE)
      setBackgroundColor(colorInt)
    }
  }

  private fun setBackgroundColor(color: Int) {
    val rootView = currentActivity.window?.decorView
    val colorInt = Color.parseColor(colorToHex(color))
    rootView?.setBackgroundColor(colorInt)
  }

  companion object {
    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
