package expo.modules.camera2.preview

import android.graphics.SurfaceTexture
import android.hardware.camera2.params.StreamConfigurationMap
import android.util.Size

import expo.modules.camera2.utils.AspectRatio
import expo.modules.camera2.utils.SizeSelectors

internal class PreviewCalculator(private val preview: Preview) {
  private val availablePreviewSizes = ArrayList<Size>()
  val previewSize: Size
    get() = calculateOptimalPreviewSize()

  fun collectAvailablePreviewSizes(map: StreamConfigurationMap) {
    availablePreviewSizes.clear()

    // Danger, W.R.! Attempting to use too large a preview size could  exceed the camera
    // bus' bandwidth limitation, resulting in gorgeous previews but the storage of garbage capture data.
    val sizes = map.getOutputSizes(SurfaceTexture::class.java)
    availablePreviewSizes.addAll(sizes)
  }

  private fun calculateOptimalPreviewSize(): Size {
    // grab biggest size possible
    val preferredSize = SizeSelectors.biggest().select(availablePreviewSizes)[0]
    val preferredAspectRatio = AspectRatio.of(preferredSize)

    // grab size of mounted surface texture
    val targetMinSize = preview.surfaceSize

    // find best-matching aspect ratio
    val matchRatio = SizeSelectors.and(
      SizeSelectors.aspectRatio(preferredAspectRatio),
      SizeSelectors.biggest())
    // find bigger than target size and sort by smallest
    val matchSize = SizeSelectors.and(
      SizeSelectors.minHeight(targetMinSize.height),
      SizeSelectors.minWidth(targetMinSize.width),
      SizeSelectors.smallest())
    val matchAll = SizeSelectors.or(
      SizeSelectors.and(matchRatio, matchSize), // Try to respect both constraints.
      matchSize, // If couldn't match aspect ratio, at least respect the size
      matchRatio, // If couldn't respect size, at least match aspect ratio
      SizeSelectors.biggest() // If couldn't match any, take the biggest.
    )

    return matchAll.select(availablePreviewSizes)[0]
  }
}
