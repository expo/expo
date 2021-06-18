package expo.modules.image.drawing

import com.facebook.yoga.YogaConstants

internal fun Float.ifYogaUndefinedUse(value: Float) =
  if (this == YogaConstants.UNDEFINED) {
    value
  } else {
    this
  }