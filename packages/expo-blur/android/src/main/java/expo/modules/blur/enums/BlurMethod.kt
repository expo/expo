package expo.modules.blur.enums

import expo.modules.kotlin.types.Enumerable

enum class BlurMethod(val method: String) : Enumerable {
  NONE("none"),
  DIMEZIS_BLUR_VIEW("dimezisBlurView")
}
