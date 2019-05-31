package expo.modules.camera2.utils

import android.util.Size

/**
 * [Size] Extensions
 */

/**
 * The aspect ratio for this size. [Float.NaN] if invalid dimensions.
 */
fun Size.aspectRatio(): AspectRatio = AspectRatio.of(this)

/**
 * @return new instance of [Size] with width and height being swapped.
 */
fun Size.swapDimensions(): Size = Size(height, width)
