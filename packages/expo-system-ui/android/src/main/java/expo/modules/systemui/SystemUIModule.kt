package expo.modules.systemui

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import androidx.appcompat.app.AppCompatDelegate
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SystemUIModule : Module() {
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  override fun definition() = ModuleDefinition {
    Name("ExpoSystemUI")

    Events("onInterfaceStyleChanged")

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

    AsyncFunction("setInterfaceStyleAsync") { theme: Theme ->
      val current = AppCompatDelegate.getDefaultNightMode()

      if (current != theme.toInterfaceStyle()) {
        when (theme) {
          Theme.DARK -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
          Theme.LIGHT -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
          Theme.AUTO -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        }
        sendEvent("onInterfaceStyleChanged", mapOf(
          "theme" to theme.value
        ))
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getInterfaceStyleAsync") {
      return@AsyncFunction when (AppCompatDelegate.getDefaultNightMode()) {
        AppCompatDelegate.MODE_NIGHT_NO -> "light"
        AppCompatDelegate.MODE_NIGHT_YES -> "dark"
        AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM -> "auto"
        else -> "auto"
      }
    }.runOnQueue(Queues.MAIN)
  }

  companion object {
    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
