package expo.modules.image

import com.bumptech.glide.load.resource.bitmap.DownsampleStrategy
import com.bumptech.glide.request.target.Target
import expo.modules.image.enums.ContentFit
import kotlin.math.min

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

class NoopDownsampleStrategy : DownsampleStrategy() {
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

class ContentFitDownsampleStrategy(private val target: ImageViewWrapperTarget, private val contentFit: ContentFit) : CustomDownsampleStrategy() {
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
    ContentFit.Fill, ContentFit.None -> 1f
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
  }

  override fun getSampleSizeRounding(
    sourceWidth: Int,
    sourceHeight: Int,
    requestedWidth: Int,
    requestedHeight: Int
  ) = SampleSizeRounding.QUALITY
}
