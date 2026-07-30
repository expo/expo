package expo.modules.image

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import com.bumptech.glide.load.engine.bitmap_recycle.BitmapPool
import com.bumptech.glide.load.resource.bitmap.BitmapTransformation
import jp.wasabeef.glide.transformations.internal.FastBlur
import java.security.MessageDigest
import kotlin.math.max

// RenderScript-free replacement for wasabeef's BlurTransformation, used to back `blurRadius`.
//
// android.renderscript is deprecated (API 31) and has no HAL on newer Android releases, so its
// ScriptIntrinsicBlur runs a CPU fallback that is not concurrency-safe: under simultaneous Glide
// loads it underflows a RenderScript object refcount and writes through a freed slot
// (rsAssert mUserRefCount > 0 / setVarObj invalid slot). Stock allocators swallow the corruption,
// but GrapheneOS hardened_malloc detects the write-after-free and aborts the process.
//
// This reuses the same FastBlur stack-blur that wasabeef itself falls back to (same downsample +
// radius), so the result is visually equivalent but never touches RenderScript.
//
// Refs: https://github.com/expo/expo/issues/24572
//       https://github.com/wasabeef/glide-transformations/issues/196
private const val ID = "expo.modules.image.SoftwareBlurTransformation.1"
private val ID_BYTES = ID.toByteArray(Charsets.UTF_8)

class SoftwareBlurTransformation(
  private val radius: Int,
  private val sampling: Int = 1
) : BitmapTransformation() {

  override fun transform(
    pool: BitmapPool,
    toTransform: Bitmap,
    outWidth: Int,
    outHeight: Int
  ): Bitmap {
    // FastBlur returns null for radius < 1, so skip the blur and return the source unchanged.
    if (radius < 1) return toTransform

    val downsample = max(1, sampling)
    val scaledWidth = max(1, toTransform.width / downsample)
    val scaledHeight = max(1, toTransform.height / downsample)

    val scaled = pool.get(scaledWidth, scaledHeight, Bitmap.Config.ARGB_8888)
    scaled.density = toTransform.density

    val canvas = Canvas(scaled)
    canvas.scale(1f / downsample, 1f / downsample)
    canvas.drawBitmap(toTransform, 0f, 0f, Paint(Paint.FILTER_BITMAP_FLAG))

    return FastBlur.blur(scaled, radius, true)
  }

  override fun updateDiskCacheKey(messageDigest: MessageDigest) {
    messageDigest.update(ID_BYTES)
    messageDigest.update("$radius,$sampling".toByteArray(Charsets.UTF_8))
  }

  override fun equals(other: Any?): Boolean =
    other is SoftwareBlurTransformation && other.radius == radius && other.sampling == sampling

  override fun hashCode(): Int = ID.hashCode() + radius * 1000 + sampling
}
