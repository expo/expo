package expo.modules.image

import com.facebook.yoga.YogaConstants

fun Float.ifYogaUndefinedUse(value: Float) =
  if (YogaConstants.isUndefined(this)) {
    value
  } else {
    this
  }

inline fun Float.ifYogaDefinedUse(transformFun: (current: Float) -> Float) =
  if (YogaConstants.isUndefined(this)) {
    this
  } else {
    transformFun(this)
  }

fun makeYogaUndefinedIfNegative(value: Float) =
  if (!YogaConstants.isUndefined(value) && value < 0) YogaConstants.UNDEFINED else value
