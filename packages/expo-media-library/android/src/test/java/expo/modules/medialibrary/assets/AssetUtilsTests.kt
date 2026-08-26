package expo.modules.medialibrary.assets

import android.graphics.BitmapFactory
import android.os.Bundle
import androidx.exifinterface.media.ExifInterface
import expo.modules.medialibrary.EXIF_TAGS
import expo.modules.medialibrary.MockAsset
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockCursor
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkClass
import io.mockk.mockkConstructor
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

@RunWith(RobolectricTestRunner::class)
internal class AssetUtilsTests {
  private val existingImagePath: String by lazy {
    File.createTempFile("expo-media-library", ".jpg").apply {
      deleteOnExit()
      writeBytes(byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0xD9.toByte()))
    }.absolutePath
  }

  @After
  fun tearDown() {
    clearAllMocks()
    unmockkAll()
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
      assertFalse(asset.containsKey("exif"))
      assertFalse(asset.containsKey("location"))
    }

    assertEquals(MockData.mockVideo.id.toString(), result[0].getString("id"))
    assertEquals("file://${MockData.mockVideo.path}", result[0].getString("uri"))
    assertEquals(MockData.mockVideo.width!!.toLong(), result[0].getLong("width"))
    assertEquals(MockData.mockVideo.height!!.toLong(), result[0].getLong("height"))

    assertEquals(MockData.mockAudio.id.toString(), result[1].getString("id"))
    assertEquals(0L, result[1].getLong("width"))
    assertEquals(0L, result[1].getLong("height"))
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
  fun `putAssetsInfo applies exif orientation over cursor orientation when fullInfo=true`() = runTest {
    mockExifOrientation(ExifInterface.ORIENTATION_ROTATE_90)

    val asset = putSingleAsset(
      MockData.mockImage.copy(path = existingImagePath, width = 100, height = 200, orientation = 0),
      resolveWithFullInfo = true
    )

    assertEquals(200L, asset.getLong("width"))
    assertEquals(100L, asset.getLong("height"))
  }

  @Test
  fun `putAssetsInfo keeps cursor orientation when exif orientation is normal`() = runTest {
    mockExifOrientation(ExifInterface.ORIENTATION_NORMAL)

    val asset = putSingleAsset(
      MockData.mockImage.copy(path = existingImagePath, width = 100, height = 200, orientation = 90),
      resolveWithFullInfo = true
    )

    assertEquals(200L, asset.getLong("width"))
    assertEquals(100L, asset.getLong("height"))
  }

  @Test
  fun `putAssetsInfo does not read exif when fullInfo=false`() = runTest {
    mockExifOrientation(ExifInterface.ORIENTATION_ROTATE_90)

    val asset = putSingleAsset(
      MockData.mockImage.copy(width = 100, height = 200, orientation = 0),
      resolveWithFullInfo = false
    )

    assertEquals(100L, asset.getLong("width"))
    assertEquals(200L, asset.getLong("height"))
    assertNull(asset.getString("localUri"))
    assertFalse(asset.containsKey("exif"))
    assertFalse(asset.containsKey("location"))
    verify(exactly = 0) {
      anyConstructed<ExifInterface>().getAttributeInt(ExifInterface.TAG_ORIENTATION, any())
    }
  }

  @Test
  fun `putAssetsInfo decodes dimensions when cursor dimensions are missing`() = runTest {
    mockDecodedBounds(width = 300, height = 400)

    val asset = putSingleAsset(
      MockData.mockImage.copy(width = 0, height = 0, orientation = 0),
      resolveWithFullInfo = false
    )

    assertEquals(300L, asset.getLong("width"))
    assertEquals(400L, asset.getLong("height"))
    assertNull(asset.getString("localUri"))
    assertFalse(asset.containsKey("exif"))
    assertFalse(asset.containsKey("location"))
  }

  @Test
  fun `putAssetsInfo keeps decoded dimensions when fullInfo=true`() = runTest {
    mockDecodedBounds(width = 300, height = 400)
    mockExifOrientation(ExifInterface.ORIENTATION_ROTATE_90)

    val asset = putSingleAsset(
      MockData.mockImage.copy(path = existingImagePath, width = 0, height = 0, orientation = 0),
      resolveWithFullInfo = true
    )

    assertEquals(400L, asset.getLong("width"))
    assertEquals(300L, asset.getLong("height"))
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

  private suspend fun putSingleAsset(mockAsset: MockAsset, resolveWithFullInfo: Boolean): Bundle {
    val cursor = mockCursor(arrayOf(mockAsset.toColumnArray()))
    val contentResolver = mockContentResolver(cursor)
    every { contentResolver.openInputStream(any()) } returns null

    val result = mutableListOf<Bundle>()
    putAssetsInfo(contentResolver, cursor, result, limit = 1, offset = 0, resolveWithFullInfo)

    assertEquals(1, result.size)
    return result.single()
  }

  private fun mockExifOrientation(exifOrientation: Int) {
    mockkConstructor(ExifInterface::class)
    every { anyConstructed<ExifInterface>().getAttribute(any()) } returns null
    every { anyConstructed<ExifInterface>().latLong } returns null
    every {
      anyConstructed<ExifInterface>().getAttributeInt(ExifInterface.TAG_ORIENTATION, any())
    } returns exifOrientation
  }

  private fun mockDecodedBounds(width: Int, height: Int) {
    mockkStatic(BitmapFactory::class)
    every { BitmapFactory.decodeFile(any(), any()) } answers {
      secondArg<BitmapFactory.Options>().apply {
        outWidth = width
        outHeight = height
      }
      null
    }
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
