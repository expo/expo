package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.PaymentSheetAppearanceException
import com.stripe.android.paymentsheet.PaymentSheet

fun buildPaymentSheetAppearance(userParams: Bundle?, context: Context): PaymentSheet.Appearance {
  val colorParams = userParams?.getBundle(PaymentSheetAppearanceKeys.COLORS)
  val lightColorParams = colorParams?.getBundle(PaymentSheetAppearanceKeys.LIGHT) ?: colorParams
  val darkColorParams = colorParams?.getBundle(PaymentSheetAppearanceKeys.DARK) ?: colorParams

  return PaymentSheet.Appearance(
    typography = buildTypography(userParams?.getBundle(PaymentSheetAppearanceKeys.FONT), context),
    colorsLight = buildColors(lightColorParams, PaymentSheet.Colors.defaultLight),
    colorsDark = buildColors(darkColorParams, PaymentSheet.Colors.defaultDark),
    shapes = buildShapes(userParams?.getBundle(PaymentSheetAppearanceKeys.SHAPES)),
    primaryButton = buildPrimaryButton(userParams?.getBundle(PaymentSheetAppearanceKeys.PRIMARY_BUTTON), context)
  )
}

private fun buildTypography(fontParams: Bundle?, context: Context): PaymentSheet.Typography {
  return PaymentSheet.Typography.default.copy(
    sizeScaleFactor = getFloatOr(fontParams, PaymentSheetAppearanceKeys.SCALE, PaymentSheet.Typography.default.sizeScaleFactor),
    fontResId = getFontResId(fontParams, PaymentSheetAppearanceKeys.FAMILY, PaymentSheet.Typography.default.fontResId, context)
  )
}

@Throws(PaymentSheetAppearanceException::class)
private fun colorFromHexOrDefault(hexString: String?, default: Int): Int {
  return hexString?.trim()?.replace("#","")?.let {
    if (it.length == 6 || it.length == 8) {
      return Color.parseColor("#$it")
    } else throw PaymentSheetAppearanceException("Failed to set Payment Sheet appearance. Expected hex string of length 6 or 8, but received: $it")
  } ?: run {
    return default
  }
}

private fun buildColors(colorParams: Bundle?, default: PaymentSheet.Colors): PaymentSheet.Colors {
  if (colorParams == null) {
    return default
  }

  return default.copy(
    primary = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.PRIMARY), default.primary),
    surface = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.BACKGROUND), default.surface),
    component = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.COMPONENT_BACKGROUND), default.component),
    componentBorder = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.COMPONENT_BORDER), default.componentBorder),
    componentDivider = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.COMPONENT_DIVIDER), default.componentDivider),
    onComponent = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.COMPONENT_TEXT), default.onComponent),
    onSurface = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.PRIMARY_TEXT), default.onSurface),
    subtitle = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.SECONDARY_TEXT), default.subtitle),
    placeholderText = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.PLACEHOLDER_TEXT), default.placeholderText),
    appBarIcon = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.ICON), default.appBarIcon),
    error = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.ERROR), default.error),
  )
}

private fun buildShapes(shapeParams: Bundle?): PaymentSheet.Shapes {
  return PaymentSheet.Shapes.default.copy(
    cornerRadiusDp = getFloatOr(shapeParams, PaymentSheetAppearanceKeys.BORDER_RADIUS, PaymentSheet.Shapes.default.cornerRadiusDp),
    borderStrokeWidthDp = getFloatOr(shapeParams, PaymentSheetAppearanceKeys.BORDER_WIDTH, PaymentSheet.Shapes.default.borderStrokeWidthDp)
  )
}

private fun buildPrimaryButton(params: Bundle?, context: Context): PaymentSheet.PrimaryButton {
  if (params == null) {
    return PaymentSheet.PrimaryButton()
  }

  val fontParams = params.getBundle(PaymentSheetAppearanceKeys.FONT) ?: Bundle.EMPTY
  val shapeParams = params.getBundle(PaymentSheetAppearanceKeys.SHAPES) ?: Bundle.EMPTY
  val colorParams = params.getBundle(PaymentSheetAppearanceKeys.COLORS) ?: Bundle.EMPTY
  val lightColorParams = colorParams.getBundle(PaymentSheetAppearanceKeys.LIGHT) ?: colorParams
  val darkColorParams = colorParams.getBundle(PaymentSheetAppearanceKeys.DARK) ?: colorParams

  return PaymentSheet.PrimaryButton(
    colorsLight = buildPrimaryButtonColors(lightColorParams, PaymentSheet.PrimaryButtonColors.defaultLight),
    colorsDark = buildPrimaryButtonColors(darkColorParams, PaymentSheet.PrimaryButtonColors.defaultDark),
    shape = PaymentSheet.PrimaryButtonShape(
      cornerRadiusDp = getFloatOrNull(shapeParams, PaymentSheetAppearanceKeys.BORDER_RADIUS),
      borderStrokeWidthDp = getFloatOrNull(shapeParams, PaymentSheetAppearanceKeys.BORDER_WIDTH),
    ),
    typography = PaymentSheet.PrimaryButtonTypography(
      fontResId = getFontResId(fontParams, PaymentSheetAppearanceKeys.FAMILY, null, context)
    )
  )
}

@Throws(PaymentSheetAppearanceException::class)
private fun buildPrimaryButtonColors(colorParams: Bundle, default: PaymentSheet.PrimaryButtonColors): PaymentSheet.PrimaryButtonColors {
  return PaymentSheet.PrimaryButtonColors(
    background = colorParams.getString(PaymentSheetAppearanceKeys.BACKGROUND)?.trim()?.replace("#", "")?.let {
      if (it.length == 6 || it.length == 8) {
        Color.parseColor("#$it")
      } else throw PaymentSheetAppearanceException("Failed to set Payment Sheet appearance. Expected hex string of length 6 or 8, but received: $it")
    } ?: run {
      null
    },
    onBackground = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.TEXT), default.onBackground),
    border = colorFromHexOrDefault(colorParams.getString(PaymentSheetAppearanceKeys.BORDER), default.border),
  )
}

private fun getFloatOr(bundle: Bundle?, key: String, defaultValue: Float): Float {
  return if (bundle?.containsKey(key) == true) {
    bundle.getFloat(key, bundle.getInt(key).toFloat())
  } else {
    defaultValue
  }
}

private fun getFloatOrNull(bundle: Bundle?, key: String): Float? {
  return if (bundle?.containsKey(key) == true) {
    bundle.getFloat(key, bundle.getInt(key).toFloat())
  } else {
    null
  }
}

@Throws(PaymentSheetAppearanceException::class)
private fun getFontResId(bundle: Bundle?, key: String, defaultValue: Int?, context: Context): Int? {
  val fontErrorPrefix = "Encountered an error when setting a custom font:"
  if (bundle?.containsKey(key) != true) {
    return defaultValue
  }

  val fontFileName = bundle.getString(key)
          ?: throw PaymentSheetAppearanceException("$fontErrorPrefix expected String for font.$key, but received null.")
  if (Regex("[^a-z0-9]").containsMatchIn(fontFileName)) {
    throw PaymentSheetAppearanceException(
      "$fontErrorPrefix appearance.font.$key should only contain lowercase alphanumeric characters on Android, but received '$fontFileName'. This value must match the filename in android/app/src/main/res/font"
    )
  }

  val id = context.resources.getIdentifier(fontFileName, "font", context.packageName)
  if (id == 0) {
    throw PaymentSheetAppearanceException("$fontErrorPrefix Failed to find font: $fontFileName")
  } else {
    return id
  }
}

private class PaymentSheetAppearanceKeys {
  companion object {
    const val COLORS = "colors"
    const val LIGHT = "light"
    const val DARK = "dark"
    const val PRIMARY = "primary"
    const val BACKGROUND = "background"
    const val COMPONENT_BACKGROUND = "componentBackground"
    const val COMPONENT_BORDER = "componentBorder"
    const val COMPONENT_DIVIDER = "componentDivider"
    const val COMPONENT_TEXT = "componentText"
    const val PRIMARY_TEXT = "primaryText"
    const val SECONDARY_TEXT = "secondaryText"
    const val PLACEHOLDER_TEXT = "placeholderText"
    const val ICON = "icon"
    const val ERROR = "error"

    const val FONT = "font"
    const val FAMILY = "family"
    const val SCALE = "scale"

    const val SHAPES = "shapes"
    const val BORDER_RADIUS = "borderRadius"
    const val BORDER_WIDTH = "borderWidth"

    const val PRIMARY_BUTTON = "primaryButton"
    const val TEXT = "text"
    const val BORDER = "border"
  }
}
