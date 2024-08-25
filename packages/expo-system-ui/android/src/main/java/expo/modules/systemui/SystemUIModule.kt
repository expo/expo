package expo.modules.systemui

import android.content.Context
import android.content.SharedPreferences
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

const val PREFERENCE_KEY = "expoRootBackgroundColor"

enum class SystemBarStyle(val value: String) : Enumerable {
  LIGHT("light"),
  DARK("dark")
}

class SystemBarsConfig : Record {
  @Field
  val statusBarStyle: SystemBarStyle? = null

  @Field
  val statusBarHidden: Boolean? = null

  @Field
  val navigationBarHidden: Boolean? = null
}

class SystemUIModule : Module() {
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val prefs: SharedPreferences
    get() = context.getSharedPreferences("expo_ui_preferences", Context.MODE_PRIVATE)
      ?: throw Exceptions.ReactContextLost()

  private val systemBackgroundColor
    get() = when (AppCompatDelegate.getDefaultNightMode()) {
      AppCompatDelegate.MODE_NIGHT_YES -> Color.BLACK
      AppCompatDelegate.MODE_NIGHT_NO -> Color.WHITE
      AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM -> {
        when (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
          Configuration.UI_MODE_NIGHT_YES -> Color.BLACK
          Configuration.UI_MODE_NIGHT_NO -> Color.WHITE
          else -> Color.WHITE
        }
      }
      else -> Color.WHITE
    }

  override fun definition() = ModuleDefinition {
    Name("ExpoSystemUI")

    AsyncFunction("setBackgroundColorAsync") { color: Int? ->
      color?.let {
        prefs.edit()
          .putInt(PREFERENCE_KEY, it)
          .apply()
      } ?: prefs.edit()
        .remove(PREFERENCE_KEY)
        .apply()
      setBackgroundColor(color ?: systemBackgroundColor)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String?>("getBackgroundColorAsync") {
      val background = currentActivity.window.decorView.background
      return@AsyncFunction if (background is ColorDrawable) {
        colorToHex((background.mutate() as ColorDrawable).color)
      } else {
        null
      }
    }

    AsyncFunction("setSystemBarsConfigAsync") { config: SystemBarsConfig ->
      val window = currentActivity.window
      val insetsController = WindowInsetsControllerCompat(window, window.decorView)

      config.statusBarStyle?.let {
        insetsController.isAppearanceLightStatusBars = it == SystemBarStyle.DARK
      }

      if (config.statusBarHidden != null || config.navigationBarHidden != null) {
        insetsController.systemBarsBehavior =
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        config.statusBarHidden?.let {
          when (it) {
            true -> insetsController.hide(WindowInsetsCompat.Type.statusBars())
            else -> insetsController.show(WindowInsetsCompat.Type.statusBars())
          }
        }
        config.navigationBarHidden?.let {
          when (it) {
            true -> insetsController.hide(WindowInsetsCompat.Type.navigationBars())
            else -> insetsController.show(WindowInsetsCompat.Type.navigationBars())
          }
        }
      }
    }.runOnQueue(Queues.MAIN)
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
