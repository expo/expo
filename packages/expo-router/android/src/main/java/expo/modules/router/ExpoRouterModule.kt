package expo.modules.router

import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import androidx.appcompat.view.ContextThemeWrapper
import com.google.android.material.color.MaterialColors

class ExpoRouterModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoRouter")

    Function("Material3Color") { name: String, scheme: String ->
      materialColor(name, scheme)
    }

    Function("Material3DynamicColor") { name: String, scheme: String ->
      dynamicColor(name, scheme)
    }
  }

  private fun materialColor(name: String, scheme: String): String? {
    val scheme = if (scheme != "dark" && scheme != "light") {
      getSystemScheme()
    } else {
      scheme
    }

    val theme = if (scheme == "dark") {
      com.google.android.material.R.style.Theme_Material3_Dark
    } else {
      com.google.android.material.R.style.Theme_Material3_Light
    }

    return getColorFromTheme(name, theme)
  }

  private fun dynamicColor(name: String, scheme: String): String? {
    val scheme = if (scheme != "dark" && scheme != "light") {
      getSystemScheme()
    } else {
      scheme
    }

    val theme = if (scheme == "dark") {
      com.google.android.material.R.style.Theme_Material3_DynamicColors_Dark
    } else {
      com.google.android.material.R.style.Theme_Material3_DynamicColors_Light
    }

    return getColorFromTheme(name, theme)
  }

  private fun getColorFromTheme(name: String, themeResId: Int): String? {
    val wrappedContext = ContextThemeWrapper(context, themeResId)
    val attr = attrMap[name.lowercase()]
      ?: return null

    return MaterialColors.getColorOrNull(wrappedContext, attr)?.let { colorToHex(it) }
  }

  private fun getSystemScheme(): String {
    val currentNightMode =
      context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    return when (currentNightMode) {
      Configuration.UI_MODE_NIGHT_YES -> "dark"
      Configuration.UI_MODE_NIGHT_NO -> "light"
      else -> "light"
    }
  }

  companion object {
    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }

    val attrMap = mapOf(
      // Some of the colors are androidx.appcompat.*
      // https://github.com/material-components/material-components-android/issues/4709
      "primary" to androidx.appcompat.R.attr.colorPrimary,
      "onprimary" to com.google.android.material.R.attr.colorOnPrimary,
      "primarycontainer" to com.google.android.material.R.attr.colorPrimaryContainer,
      "onprimarycontainer" to com.google.android.material.R.attr.colorOnPrimaryContainer,
      "primaryinverse" to com.google.android.material.R.attr.colorPrimaryInverse,
      "primaryfixed" to com.google.android.material.R.attr.colorPrimaryFixed,
      "primaryfixeddim" to com.google.android.material.R.attr.colorPrimaryFixedDim,
      "onprimaryfixed" to com.google.android.material.R.attr.colorOnPrimaryFixed,
      "onprimaryfixedvariant" to com.google.android.material.R.attr.colorOnPrimaryFixedVariant,
      "secondary" to com.google.android.material.R.attr.colorSecondary,
      "onsecondary" to com.google.android.material.R.attr.colorOnSecondary,
      "secondarycontainer" to com.google.android.material.R.attr.colorSecondaryContainer,
      "onsecondarycontainer" to com.google.android.material.R.attr.colorOnSecondaryContainer,
      "secondaryfixed" to com.google.android.material.R.attr.colorSecondaryFixed,
      "secondaryfixeddim" to com.google.android.material.R.attr.colorSecondaryFixedDim,
      "onsecondaryfixed" to com.google.android.material.R.attr.colorOnSecondaryFixed,
      "onsecondaryfixedvariant" to com.google.android.material.R.attr.colorOnSecondaryFixedVariant,
      "tertiary" to com.google.android.material.R.attr.colorTertiary,
      "ontertiary" to com.google.android.material.R.attr.colorOnTertiary,
      "tertiarycontainer" to com.google.android.material.R.attr.colorTertiaryContainer,
      "ontertiarycontainer" to com.google.android.material.R.attr.colorOnTertiaryContainer,
      "tertiaryfixed" to com.google.android.material.R.attr.colorTertiaryFixed,
      "tertiaryfixeddim" to com.google.android.material.R.attr.colorTertiaryFixedDim,
      "ontertiaryfixed" to com.google.android.material.R.attr.colorOnTertiaryFixed,
      "ontertiaryfixedvariant" to com.google.android.material.R.attr.colorOnTertiaryFixedVariant,
      "error" to androidx.appcompat.R.attr.colorError,
      "onerror" to com.google.android.material.R.attr.colorOnError,
      "errorcontainer" to com.google.android.material.R.attr.colorErrorContainer,
      "onerrorcontainer" to com.google.android.material.R.attr.colorOnErrorContainer,
      "outline" to com.google.android.material.R.attr.colorOutline,
      "outlinevariant" to com.google.android.material.R.attr.colorOutlineVariant,
      "background" to android.R.attr.colorBackground,
      "onbackground" to com.google.android.material.R.attr.colorOnBackground,
      "surface" to com.google.android.material.R.attr.colorSurface,
      "onsurface" to com.google.android.material.R.attr.colorOnSurface,
      "surfacevariant" to com.google.android.material.R.attr.colorSurfaceVariant,
      "onsurfacevariant" to com.google.android.material.R.attr.colorOnSurfaceVariant,
      "surfaceinverse" to com.google.android.material.R.attr.colorSurfaceInverse,
      "onsurfaceinverse" to com.google.android.material.R.attr.colorOnSurfaceInverse,
      "surfacebright" to com.google.android.material.R.attr.colorSurfaceBright,
      "surfacedim" to com.google.android.material.R.attr.colorSurfaceDim,
      "surfacecontainer" to com.google.android.material.R.attr.colorSurfaceContainer,
      "surfacecontainerlow" to com.google.android.material.R.attr.colorSurfaceContainerLow,
      "surfacecontainerlowest" to com.google.android.material.R.attr.colorSurfaceContainerLowest,
      "surfacecontainerhigh" to com.google.android.material.R.attr.colorSurfaceContainerHigh,
      "surfacecontainerhighest" to com.google.android.material.R.attr.colorSurfaceContainerHighest
    )
  }
}
