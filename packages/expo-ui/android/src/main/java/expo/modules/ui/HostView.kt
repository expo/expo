package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.LocalContext
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

internal enum class ExpoColorScheme(val value: String) : Enumerable {
  LIGHT("light"),
  DARK("dark");

  fun toColorScheme(context: Context): ColorScheme {
    val isDynamicColorSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    return when (this) {
      LIGHT -> if (isDynamicColorSupported) dynamicLightColorScheme(context) else lightColorScheme()
      DARK -> if (isDynamicColorSupported) dynamicDarkColorScheme(context) else darkColorScheme()
    }
  }

  companion object {
    fun defaultColorScheme(context: Context, isSystemInDarkTheme: Boolean): ColorScheme {
      val isDynamicColorSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
      return if (isDynamicColorSupported) {
        if (isSystemInDarkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      } else {
        if (isSystemInDarkTheme) darkColorScheme() else lightColorScheme()
      }
    }
  }
}

internal data class HostProps(
  val colorScheme: MutableState<ExpoColorScheme?> = mutableStateOf(null)
) : ComposeProps

@SuppressLint("ViewConstructor")
internal class HostView(context: Context, appContext: AppContext) :
  ExpoComposeView<HostProps>(context, appContext, withHostingView = true) {
  override val props = HostProps()

  @Composable
  override fun ComposableScope.Content() {
    val context = LocalContext.current
    val colorScheme = props.colorScheme.value?.toColorScheme(context)
      ?: ExpoColorScheme.defaultColorScheme(context, isSystemInDarkTheme())

    MaterialTheme(colorScheme = colorScheme) {
      for (index in 0..<this@HostView.size) {
        val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
        with(this) {
          with(child) {
            Content()
          }
        }
      }
    }
  }
}
