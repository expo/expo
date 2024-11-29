package expo.modules.video

import android.graphics.Bitmap
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlin.time.Duration

class VideoThumbnail(
  ref: Bitmap,
  val requestedTime: Duration,
  val actualTime: Duration
) : SharedRef<Bitmap>(ref) {
  val width = ref.width
  val height = ref.height

  override val nativeRefType: String = "image"

  override fun getAdditionalMemoryPressure(): Int {
    return ref.byteCount
  }
}
