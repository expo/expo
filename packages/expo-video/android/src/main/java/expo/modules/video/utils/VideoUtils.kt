package expo.modules.video.utils

import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable
import com.facebook.react.uimanager.style.BorderRadiusProp

fun CSSBackgroundDrawable.applyBorderRadius(config: FloatArray) = config
  .map { it.ifYogaDefinedUse(PixelUtil::toPixelFromDIP) }
  .forEachIndexed { i, radius ->
    if (i == 0) {
      setBorderRadius(BorderRadiusProp.BORDER_RADIUS, LengthPercentage(radius, LengthPercentageType.POINT))
    } else {
      setBorderRadius(BorderRadiusProp.entries[i - 1], LengthPercentage(radius, LengthPercentageType.POINT))
    }
  }