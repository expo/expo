package expo.modules.medialibrary.assets

import android.os.Build
import android.os.Bundle
import androidx.exifinterface.media.ExifInterface
import expo.modules.medialibrary.EXIF_TAGS
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockCursor
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkClass
import io.mockk.mockkConstructor
import io.mockk.mockkStatic
import io.mockk.unmockkConstructor
import io.mockk.unmockkStatic
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
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
  fun `putAssetsInfo returns correct response when fullInfo=false`() = runTest {
    // arrange
    val cursor = mockCursor(
      arrayOf(
        MockData.mockVideo.toColumnArray(),
        MockData.mockAudio.toColumnArray(),
        MockData.mockImage.toColumnArray()
      )
    )

    val contentResolver = mockContentResolver(cursor)

    // act
    val result = mutableListOf<Bundle>()
    putAssetsInfo(contentResolver, cursor, result, limit = 5, offset = 0, resolveWithFullInfo = false)

    // assert
    assertEquals(3, result.size)

    result.forEach { asset ->
      // no exif or detailed ddata
      assertNull(asset.getString("localUri"))
      assertNull(asset.getParcelable("exif"))
      assertNull(asset.getParcelable("location"))
    }

    assertEquals(MockData.mockVideo.id.toString(), result[0].getString("id"))
    assertEquals("file://${MockData.mockVideo.path}", result[0].getString("uri"))
    assertEquals(MockData.mockVideo.width!!.toLong(), result[0].getLong("width"))
    assertEquals(MockData.mockVideo.height!!.toLong(), result[0].getLong("height"))
  }

  @Test
  fun `putAssetsInfo returns exif and location when fullInfo=true for images`() = runTest {
    mockkConstructor(ExifInterface::class)
    every { anyConstructed<ExifInterface>().getAttribute(any()) } returns "value"
    every { anyConstructed<ExifInterface>().getAttributeInt(any(), any()) } returns 1
    every { anyConstructed<ExifInterface>().getAttributeDouble(any(), any()) } returns 1.0
    every { anyConstructed<ExifInterface>().latLong } returns doubleArrayOf(1.23, 4.56)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      mockkStatic(::getExifLocationForUri)
      every { getExifLocationForUri(any(), any()) } returns Bundle().apply {
        putDouble("latitude", 1.23)
        putDouble("longitude", 4.56)
      }
    }

    val cursor = mockCursor(arrayOf(MockData.mockImage.toColumnArray()))
    val contentResolver = mockContentResolver(cursor)
    val result = mutableListOf<Bundle>()

    putAssetsInfo(contentResolver, cursor, result, limit = 1, offset = 0, resolveWithFullInfo = true)

    assertEquals(1, result.size)
    val asset = result[0]
    assertEquals("file://${MockData.mockImage.path}", asset.getString("localUri"))
    assertNotNull(asset.getParcelable("exif"))
    assertNotNull(asset.getParcelable("location"))
    verify { anyConstructed<ExifInterface>() }

    unmockkConstructor(ExifInterface::class)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      unmockkStatic(::getExifLocationForUri)
    }
  }

  @Test
  fun `putAssetsInfo preserves cursor position for pagination`() = runTest {
    val cursor = mockCursor(
      arrayOf(
        MockData.mockImage.toColumnArray(),
        MockData.mockVideo.toColumnArray(),
        MockData.mockAudio.toColumnArray()
      )
    )
    val contentResolver = mockContentResolver(cursor)
    val result = mutableListOf<Bundle>()

    putAssetsInfo(contentResolver, cursor, result, limit = 2, offset = 0, resolveWithFullInfo = false)

    assertEquals(2, result.size)
    assertEquals(2, cursor.position)
  }

  @Test
  fun `maybeRotateAssetSize returns correct values`() {
    // arrange
    val width = 100
    val height = 200
    val nonSwappedDimensions = Pair(width, height)
    val swappedDimensions = Pair(height, width)

    // act
    val rotated_0 = maybeRotateAssetSize(width, height, orientation = 0)
    val rotated_90 = maybeRotateAssetSize(width, height, orientation = 90)
    val rotated_180 = maybeRotateAssetSize(width, height, orientation = 180)
    val rotated_270 = maybeRotateAssetSize(width, height, orientation = 270)
    val rotated_m90 = maybeRotateAssetSize(width, height, orientation = -90)

    // assert
    assertEquals(nonSwappedDimensions, rotated_0)
    assertEquals(swappedDimensions, rotated_90)
    assertEquals(nonSwappedDimensions, rotated_180)
    assertEquals(swappedDimensions, rotated_270)
    assertEquals(swappedDimensions, rotated_m90)
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

      // act
      val locationBundle = getExifLocationLegacy(exifInterface)

      // assert
      assertNotNull(locationBundle)
      assertTrue("Result is missing 'latitude' key", locationBundle!!.containsKey("latitude"))
      assertTrue("Result is missing 'latitude' key", locationBundle.containsKey("longitude"))
      assertEquals(lat, locationBundle.getDouble("latitude"), 0.001)
      assertEquals(lng, locationBundle.getDouble("longitude"), 0.001)
    }

    @Test
    fun `legacy getExifLocation should give null when unavailable`() {
      // arrange
      val exifInterface = mockkClass(ExifInterface::class)
      every { exifInterface.latLong } returns null

      // act
      val locationBundle = getExifLocationLegacy(exifInterface)

      // assert
      assertNull(locationBundle)
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
      verify(atLeast = EXIF_TAGS.size) { exifInterface.getAttribute(any()) }
    }
  }
}
