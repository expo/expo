package abi48_0_0.expo.modules.systemui

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import abi48_0_0.expo.modules.kotlin.exception.Exceptions
import abi48_0_0.expo.modules.kotlin.functions.Queues
import abi48_0_0.expo.modules.kotlin.modules.Module
import abi48_0_0.expo.modules.kotlin.modules.ModuleDefinition

class SystemUIModule : Module() {
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  override fun definition() = ModuleDefinition {
    Name("ExpoSystemUI")

    AsyncFunction("setBackgroundColorAsync") { color: Int ->
      val rootView = currentActivity.window.decorView
      val colorInt = Color.parseColor(colorToHex(color))
      rootView.setBackgroundColor(colorInt)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getBackgroundColorAsync") {
      val background = currentActivity.window.decorView.background
      return@AsyncFunction if (background is ColorDrawable) {
        colorToHex((background.mutate() as ColorDrawable).color)
      } else {
        null
      }
    }
  }

  companion object {
    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
