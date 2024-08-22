package expo.modules.image

import android.graphics.RectF
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable
import com.facebook.react.uimanager.style.BorderRadiusProp

fun calcXTranslation(
  value: Float,
  imageRect: RectF,
  viewRect: RectF,
  isPercentage: Boolean = false,
  isReverse: Boolean = false
): Float = calcTranslation(value, imageRect.width(), viewRect.width(), isPercentage, isReverse)

fun calcYTranslation(
  value: Float,
  imageRect: RectF,
  viewRect: RectF,
  isPercentage: Boolean = false,
  isReverse: Boolean = false
): Float = calcTranslation(value, imageRect.height(), viewRect.height(), isPercentage, isReverse)

fun calcTranslation(
  value: Float,
  imageRefValue: Float,
  viewRefValue: Float,
  isPercentage: Boolean = false,
  isReverse: Boolean = false
): Float {
  if (isPercentage) {
    val finalPercentage = if (isReverse) {
      100f - value
    } else {
      value
    }
    return (finalPercentage / 100f) * (viewRefValue - imageRefValue)
  }

  if (isReverse) {
    return viewRefValue - imageRefValue - value
  }

  return value
}

fun CSSBackgroundDrawable.applyBorderRadius(config: FloatArray) = config
  .map { it.ifYogaDefinedUse(PixelUtil::toPixelFromDIP) }
  .forEachIndexed { i, radius ->
    if (i == 0) {
      setBorderRadius(BorderRadiusProp.BORDER_RADIUS, LengthPercentage(radius, LengthPercentageType.POINT))
    } else {
      setBorderRadius(BorderRadiusProp.entries[i - 1], LengthPercentage(radius, LengthPercentageType.POINT))
    }
  }
