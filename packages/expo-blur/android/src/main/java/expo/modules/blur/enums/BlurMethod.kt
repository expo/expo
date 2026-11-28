package expo.modules.blur.enums

import expo.modules.kotlin.types.Enumerable

enum class BlurMethod(val value: String) : Enumerable {
  NONE("none"),
  DIMEZIS_BLUR_VIEW("dimezisBlurView"),
  DIMEZIS_BLUR_VIEW_SDK_31_PLUS("dimezisBlurViewSdk31Plus"),
  PLATFORM_BACKDROP("platformBackdrop");

  val usesDimezis: Boolean
    get() = this == DIMEZIS_BLUR_VIEW || this == DIMEZIS_BLUR_VIEW_SDK_31_PLUS
}
