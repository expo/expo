package expo.modules.medialibrary.assets

import android.os.Bundle
import androidx.exifinterface.media.ExifInterface
import expo.modules.medialibrary.MediaLibraryConstants
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockCursor
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkClass
import io.mockk.mockkStatic
import io.mockk.verify
import org.junit.After
import org.junit.Assert
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class AssetUtilsTests {
  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `putAssetsInfo returns correct response when fullInfo=false`() {
    // arrange
    val cursor = mockCursor(
      arrayOf(
        MockData.mockVideo.toColumnArray(),
        MockData.mockAudio.toColumnArray()
      )
    )

    val contentResolver = mockContentResolver(cursor)

    mockkStatic(::getAssetDimensionsFromCursor)
    every {
      getAssetDimensionsFromCursor(contentResolver, any(), cursor, any(), any())
    } returns intArrayOf(0, 0) andThen intArrayOf(100, 200)

    // act
    val result = mutableListOf<Bundle>()
    putAssetsInfo(contentResolver, cursor, result, limit = 5, offset = 0, resolveWithFullInfo = false)

    // assert
    verify(exactly = 0) {
      getExifFullInfo(any(), any())
    }

    assertEquals(2, result.size)

    assertEquals(MockData.mockVideo.id.toString(), result[0].getString("id"))
    assertEquals("file://${MockData.mockVideo.path}", result[0].getString("uri"))

    assertNull(result[0].getString("localUri"))
  }

  @Test
  fun `maybeRotateAssetSize returns correct values`() {
    // arrange
    val width = 100
    val height = 200
    val nonSwappedArray = intArrayOf(width, height)
    val swappedArray = intArrayOf(height, width)

    // act
    val rotated_0 = maybeRotateAssetSize(width, height, orientation = 0)
    val rotated_90 = maybeRotateAssetSize(width, height, orientation = 90)
    val rotated_180 = maybeRotateAssetSize(width, height, orientation = 180)
    val rotated_270 = maybeRotateAssetSize(width, height, orientation = 270)
    val rotated_m90 = maybeRotateAssetSize(width, height, orientation = -90)

    // assert
    Assert.assertArrayEquals(nonSwappedArray, rotated_0)
    Assert.assertArrayEquals(swappedArray, rotated_90)
    Assert.assertArrayEquals(nonSwappedArray, rotated_180)
    Assert.assertArrayEquals(swappedArray, rotated_270)
    Assert.assertArrayEquals(swappedArray, rotated_m90)
  }

  @RunWith(RobolectricTestRunner::class)
  class ExifTests {
    @Test
    fun `legacy getExifLocation should return proper bundle`() {
      // arrange
      val lat = 1.23
      val lng = 4.56

      val exifInterface = mockkClass(ExifInterface::class)
      every { exifInterface.latLong } returns doubleArrayOf(lat, lng)

      val assetBundle = Bundle()

      // act
      getExifLocationLegacy(exifInterface, assetBundle)

      // assert
      assertTrue("Result bundle is missing 'location' key", assetBundle.containsKey("location"))
      val locationBundle = assetBundle.getParcelable<Bundle>("location")!!
      assertTrue("Result is missing 'latitude' key", locationBundle.containsKey("latitude"))
      assertTrue("Result is missing 'latitude' key", locationBundle.containsKey("longitude"))
      assertEquals(lat, locationBundle.getDouble("latitude"), 0.001)
      assertEquals(lng, locationBundle.getDouble("longitude"), 0.001)
    }

    @Test
    fun `legacy getExifLocation should give null when unavailable`() {
      // arrange
      val exifInterface = mockkClass(ExifInterface::class)
      every { exifInterface.latLong } returns null

      val assetBundle = Bundle()

      // act
      getExifLocationLegacy(exifInterface, assetBundle)

      // assert
      assertTrue(assetBundle.containsKey("location"))
      assertNull(assetBundle.getParcelable("location"))
    }

    @Test
    fun `getExifFullInfo creates exif value`() {
      // arrange
      val response = Bundle()
      val exifInterface = mockk<ExifInterface>(relaxed = true)
      every { exifInterface.getAttribute(any()) } returns null

      // act
      getExifFullInfo(exifInterface, response)

      // assert
      assertTrue("Response has no exif value", response.containsKey("exif"))
    }

    @Test
    fun `getExifFullInfo iterates through exifTags`() {
      // arrange
      val exifInterface = mockk<ExifInterface>(relaxed = true)
      every { exifInterface.getAttribute(any()) } returns null

      // act
      getExifFullInfo(exifInterface, Bundle())

      // assert
      verify(atLeast = MediaLibraryConstants.exifTags.size) { exifInterface.getAttribute(any()) }
    }
  }
}
