package expo.modules.font

import android.graphics.Color
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class RenderToImageOptions(
  @Field
  val fontFamily: String = "",

  @Field
  val size: Float = 24f,

  @Field
  val lineHeight: Float? = null,

  @Field
  val color: Int = Color.BLACK
) : Record
