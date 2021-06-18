package expo.modules.image.drawing

import com.facebook.yoga.YogaConstants

internal fun Float.ifYogaUndefinedUse(value: Float) =
  if (YogaConstants.isUndefined(this)) {
    value
  } else {
    this
  }
