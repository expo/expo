package expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import androidx.appcompat.app.AppCompatDelegate
import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

const val PREFERENCE_KEY = "expoRootBackgroundColor"

@ExpoModule("ExpoSystemUI")
class SystemUIModule : Module() {
  private val activity: Activity
    get() = currentActivity ?: throw Exceptions.MissingActivity()
  private val prefs: SharedPreferences
    get() = androidContext.getSharedPreferences("expo_ui_preferences", Context.MODE_PRIVATE)
      ?: throw Exceptions.ReactContextLost()

  private val systemBackgroundColor
    get() = when (AppCompatDelegate.getDefaultNightMode()) {
      AppCompatDelegate.MODE_NIGHT_YES -> Color.BLACK
      AppCompatDelegate.MODE_NIGHT_NO -> Color.WHITE
      AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM -> {
        when (androidContext.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
          Configuration.UI_MODE_NIGHT_YES -> Color.BLACK
          Configuration.UI_MODE_NIGHT_NO -> Color.WHITE
          else -> Color.WHITE
        }
      }
      else -> Color.WHITE
    }

  @JS
  suspend fun setBackgroundColorAsync(color: Int?): Unit = withContext(Dispatchers.Main) {
    color?.let {
      prefs.edit()
        .putInt(PREFERENCE_KEY, it)
        .apply()
    } ?: prefs.edit()
      .remove(PREFERENCE_KEY)
      .apply()
    setBackgroundColor(color ?: systemBackgroundColor)
  }

  @JS
  suspend fun getBackgroundColorAsync(): String? = withContext(Dispatchers.IO) {
    val background = activity.window.decorView.background
    if (background is ColorDrawable) {
      colorToHex((background.mutate() as ColorDrawable).color)
    } else {
      null
    }
  }

  private fun setBackgroundColor(color: Int) {
    val rootView = activity.window?.decorView
    val colorInt = Color.parseColor(colorToHex(color))
    rootView?.setBackgroundColor(colorInt)
  }

  companion object {
    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
