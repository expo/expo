package expo.modules.font

import android.graphics.Color
import io.github.expo.modules.v2.Record

@Record
data class RenderToImageOptions(
  val fontFamily: String = "",
  val size: Float = 24f,
  val lineHeight: Float? = null,
  val color: Int = Color.BLACK
)

@Record
data class RenderToImageResult(
  val uri: String,
  val width: Float,
  val height: Float,
  val scale: Float
)
