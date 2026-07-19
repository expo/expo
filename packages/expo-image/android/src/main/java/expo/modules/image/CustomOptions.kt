package expo.modules.image

import com.bumptech.glide.load.Option

object CustomOptions {
  // To pass the tint color to the SVG decoder, we need to wrap it in a custom Glide option.
  val tintColor = Option.memory<Int>("ExpoTintColor")
}
