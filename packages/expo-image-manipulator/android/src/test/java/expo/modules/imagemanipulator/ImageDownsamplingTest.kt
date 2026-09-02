package expo.modules.imagemanipulator

import android.graphics.Bitmap
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ImageDownsamplingTest {
  @Test
  fun boundedSizeReturnsNullWhenNoBoundsAreGiven() {
    assertNull(boundedSize(100, 50, null, null))
  }

  @Test
  fun boundedSizeReturnsNullWhenTheImageFitsWithinTheBounds() {
    assertNull(boundedSize(100, 50, 100, 50))
    assertNull(boundedSize(100, 50, 200, null))
    assertNull(boundedSize(100, 50, null, 80))
  }

  @Test
  fun boundedSizeCapsWidthPreservingAspectRatio() {
    assertEquals(Pair(50, 25), boundedSize(100, 50, 50, null))
  }

  @Test
  fun boundedSizeCapsHeightPreservingAspectRatio() {
    assertEquals(Pair(50, 25), boundedSize(100, 50, null, 25))
  }

  @Test
  fun boundedSizeUsesTheMostRestrictiveBound() {
    assertEquals(Pair(20, 10), boundedSize(100, 50, 50, 10))
  }

  @Test
  fun boundedSizeIgnoresNonPositiveBounds() {
    assertNull(boundedSize(100, 50, 0, -10))
  }

  @Test
  fun downscaleIfExceedsBoundsCapsAnOversizedBitmap() {
    val bitmap = Bitmap.createBitmap(100, 50, Bitmap.Config.ARGB_8888)
    val result = downscaleIfExceedsBounds(bitmap, 40, null)

    assertEquals(40, result.width)
    assertEquals(20, result.height)
  }

  @Test
  fun downscaleIfExceedsBoundsReturnsTheSameBitmapWhenItFits() {
    val bitmap = Bitmap.createBitmap(100, 50, Bitmap.Config.ARGB_8888)

    assertSame(bitmap, downscaleIfExceedsBounds(bitmap, null, null))
    assertSame(bitmap, downscaleIfExceedsBounds(bitmap, 100, 50))
  }
}
