package expo.modules.image

import com.bumptech.glide.load.Option

object CustomOptions {
  // To pass the tint color to the SVG decoder, we need to wrap it in a custom Glide option.
  val tintColor = Option.memory<Int>("ExpoTintColor")

  // Values for the CSS custom properties an SVG source refers to with `var()`.
  // Memory-only, like the tint color: the disk cache keeps the original document under a key that
  // ignores the variables, while the memory cache keys decoded pictures by them, so two different
  // sets of variables share one download but can never be served for each other.
  val svgVariables = Option.memory<Map<String, String>>("ExpoSVGVariables")
}
