package expo.modules.image

import android.os.Build
import com.bumptech.glide.load.resource.bitmap.DownsampleStrategy
import com.bumptech.glide.request.target.Target
import expo.modules.image.enums.ContentFit
import expo.modules.image.records.DecodeFormat
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Glide uses `hashCode` and `equals` of the `DownsampleStrategy` to calculate the cache key.
 * However, we generate this object dynamically, which means that each instance will be different.
 * Unfortunately, this behaviour is not correct since Glide will not load
 * the image from memory no matter what.
 * To fix this issue, we set the `hashCode` to a fixed number and
 * override `equals` to only check if objects have the common type.
 */
abstract class CustomDownsampleStrategy : DownsampleStrategy() {
  override fun equals(other: Any?): Boolean {
    return other is CustomDownsampleStrategy
  }

  override fun hashCode(): Int {
    return 302008237
  }
}

object NoopDownsampleStrategy : DownsampleStrategy() {
  override fun getScaleFactor(
    sourceWidth: Int,
    sourceHeight: Int,
    requestedWidth: Int,
    requestedHeight: Int
  ): Float = 1f

  override fun getSampleSizeRounding(
    sourceWidth: Int,
    sourceHeight: Int,
    requestedWidth: Int,
    requestedHeight: Int
  ): SampleSizeRounding = SampleSizeRounding.QUALITY
}

class PlaceholderDownsampleStrategy(
  private val target: ImageViewWrapperTarget
) : CustomDownsampleStrategy() {
  private var wasTriggered = false

  override fun getScaleFactor(sourceWidth: Int, sourceHeight: Int, requestedWidth: Int, requestedHeight: Int): Float {
    if (!wasTriggered) {
      target.placeholderWidth = sourceWidth
      target.placeholderHeight = sourceHeight
      wasTriggered = true
    }
    return 1f
  }

  override fun getSampleSizeRounding(sourceWidth: Int, sourceHeight: Int, requestedWidth: Int, requestedHeight: Int): SampleSizeRounding {
    return SampleSizeRounding.QUALITY
  }
}

class ContentFitDownsampleStrategy(
  private val target: ImageViewWrapperTarget,
  private val contentFit: ContentFit
) : CustomDownsampleStrategy() {
  private var wasTriggered = false
  override fun getScaleFactor(
    sourceWidth: Int,
    sourceHeight: Int,
    requestedWidth: Int,
    requestedHeight: Int
  ): Float {
    // The method is invoked twice per asset, but we only need to preserve the original dimensions for the first call.
    // As Glide uses Android downsampling, it can only adjust dimensions by a factor of two,
    // and hence two distinct scaling factors are computed to achieve greater accuracy.
    if (!wasTriggered) {
      target.sourceWidth = sourceWidth
      target.sourceHeight = sourceHeight
      wasTriggered = true
    }

    // The size of the container is unknown, we don't know what to do, so we just run the default scale.
    if (requestedWidth == Target.SIZE_ORIGINAL || requestedHeight == Target.SIZE_ORIGINAL) {
      return 1f
    }

    val aspectRation = calculateScaleFactor(
      sourceWidth.toFloat(),
      sourceHeight.toFloat(),
      requestedWidth.toFloat(),
      requestedHeight.toFloat()
    )

    // We don't want to upscale the image
    return min(1f, aspectRation)
  }

  private fun calculateScaleFactor(
    sourceWidth: Float,
    sourceHeight: Float,
    requestedWidth: Float,
    requestedHeight: Float
  ): Float = when (contentFit) {
    ContentFit.Contain -> min(
      requestedWidth / sourceWidth,
      requestedHeight / sourceHeight
    )
    ContentFit.Cover -> java.lang.Float.max(
      requestedWidth / sourceWidth,
      requestedHeight / sourceHeight
    )
    ContentFit.ScaleDown -> if (requestedWidth < sourceWidth || requestedHeight < sourceHeight) {
      // The container is smaller than the image — scale it down and behave like `contain`
      min(
        requestedWidth / sourceWidth,
        requestedHeight / sourceHeight
      )
    } else {
      // The container is bigger than the image — don't scale it and behave like `none`
      1f
    }
    else -> 1f
  }

  override fun getSampleSizeRounding(
    sourceWidth: Int,
    sourceHeight: Int,
    requestedWidth: Int,
    requestedHeight: Int
  ) = SampleSizeRounding.QUALITY
}

/**
 * Android has hardware bitmap size limit that can be drown on the canvas.
 * To prevents crashes, we need to downsample the image to fit into the maximum bitmap size.
 */
class SafeDownsampleStrategy(
  private val decodeFormat: DecodeFormat
) : CustomDownsampleStrategy() {
  override fun getScaleFactor(
    sourceWidth: Int,
    sourceHeight: Int,
    requestedWidth: Int,
    requestedHeight: Int
  ): Float {
    if (maxBitmapSize <= 0) {
      return 1f
    }

    val sourceSize = sourceWidth * sourceHeight * decodeFormat.toBytes()
    if (sourceSize <= maxBitmapSize) {
      return 1f
    }

    // We need to downsample the image to fit into the maximum bitmap size.
    // Calculate the aspect ratio of the source image. It's always <= 1.
    val srcAspectRatio = min(sourceWidth, sourceHeight).toDouble() / max(sourceWidth, sourceHeight).toDouble()
    // Calculate the area of the destination image.
    val dstArea = maxBitmapSize / decodeFormat.toBytes()
    // Calculate the longer side of the destination image using following formulas:
    // dstLongerSide * dstSmallerSide = dstArea
    // srcAspectRation * dstLongerSide = dstSmallerSide
    // after substitution:
    // srcAspectRation * dstLongerSide * dstLongerSide = dstArea
    // dstLongerSide = sqrt(dstArea / srcAspectRatio)
    val x = floor(sqrt(dstArea.toDouble() / srcAspectRatio)).toInt()

    // Calculate the scale factor using longer side of both images.
    val scaleFactor = x.toDouble() / max(sourceWidth, sourceHeight).toDouble()

    return scaleFactor.toFloat()
  }

  override fun getSampleSizeRounding(
    sourceWidth: Int,
    sourceHeight: Int,
    requestedWidth: Int,
    requestedHeight: Int
  ): SampleSizeRounding {
    return SampleSizeRounding.MEMORY
  }

  private val maxBitmapSize by lazy {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return@lazy -1
    }

    return@lazy try {
      val defaultSize = 100 * 1024 * 1024 // 100 MB - from `RecordingCanvas` src

      // We're trying to get the value of `ro.hwui.max_texture_allocation_size` property
      // which is used by `RecordingCanvas` to determine the maximum bitmap size.
      @Suppress("PrivateApi")
      val getIntMethod = Class
        .forName("android.os.SystemProperties")
        .getMethod("getInt", String::class.java, Int::class.java)
      getIntMethod.isAccessible = true
      (getIntMethod.invoke(null, "ro.hwui.max_texture_allocation_size", defaultSize) as Int)
        .coerceAtLeast(defaultSize)
    } catch (e: Throwable) {
      // If something goes wrong we just return -1 and don't downsample the image.
      -1
    }
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }
    if (other !is SafeDownsampleStrategy) {
      return false
    }

    return decodeFormat == other.decodeFormat
  }

  override fun hashCode(): Int {
    var result = super.hashCode()
    result = 31 * result + decodeFormat.hashCode()
    return result
  }
}
