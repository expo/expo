package expo.modules.image.records

import android.graphics.Color
import com.bumptech.glide.request.target.Target.SIZE_ORIGINAL
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class ImageLoadOptions(
  @Field
  val maxWidth: Int = SIZE_ORIGINAL,
  @Field
  val maxHeight: Int = SIZE_ORIGINAL,
  @Field
  val tintColor: Color? = null
) : Record
