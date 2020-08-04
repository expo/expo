package expo.modules.medialibrary

import android.os.Bundle
import android.provider.MediaStore
import androidx.exifinterface.media.ExifInterface
import expo.modules.medialibrary.MediaLibraryConstants.ERROR_IO_EXCEPTION
import expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.MediaLibraryConstants.exifTags
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.mockkClass
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertListsEqual
import org.unimodules.test.core.assertRejected
import org.unimodules.test.core.promiseRejected
import org.unimodules.test.core.promiseResolved
import org.unimodules.test.core.promiseResolvedWithType
import java.io.File
import java.io.IOException
import java.lang.IllegalArgumentException


@RunWith(RobolectricTestRunner::class)
internal class MediaLibraryUtilsTests {

  @Test
  fun `getInPart() should return correct result`() {
    //arrange
    val assetIds = arrayOf("aaa", "bbb", "ccc")

    //act
    val result = MediaLibraryUtils.getInPart(assetIds)

    //assert
    assertEquals("?,?,?", result)
  }

  @Test
  fun `getExifLocation should return proper bundle`() {
    //arrange
    val lat = 1.23
    val lng = 4.56

    val exifInterface = mockkClass(ExifInterface::class)
    every { exifInterface.latLong } returns doubleArrayOf(lat, lng)

    val assetBundle = Bundle()

    //act
    MediaLibraryUtils.getExifLocation(exifInterface, assetBundle)

    //assert
    assertTrue(assetBundle.containsKey("location"))
    val locationBundle = assetBundle.getParcelable<Bundle>("location")!!
    assertTrue(locationBundle.containsKey("latitude"))
    assertTrue(locationBundle.containsKey("longitude"))
    assertTrue(lat.equals(locationBundle.getDouble("latitude")))
    assertTrue(lng.equals(locationBundle.getDouble("longitude")))
  }

  @Test
  fun `getExifLocation should give null when unavailable`() {
    //arrange
    val exifInterface = mockkClass(ExifInterface::class)
    every { exifInterface.latLong } returns null

    val assetBundle = Bundle()

    //act
    MediaLibraryUtils.getExifLocation(exifInterface, assetBundle)

    //assert
    assertTrue(assetBundle.containsKey("location"))
    assertNull(assetBundle.getParcelable("location"))
  }
  
  @Test
  fun `getExifFullInfo creates exif value`() {
    //arrange
    val response = Bundle()
    val exifInterface = mockk<ExifInterface>(relaxed = true)
    every {exifInterface.getAttribute(any())} returns null

    //act
    val result = MediaLibraryUtils.getExifFullInfo(exifInterface, response)

    //assert
    assertTrue(response.containsKey("exif"))
  }

  @Test
  fun `getExifFullInfo iterates through exifTags`() {
    //arrange
    val exifInterface = mockk<ExifInterface>(relaxed = true)
    every {exifInterface.getAttribute(any())} returns null

    //act
    MediaLibraryUtils.getExifFullInfo(exifInterface, Bundle())

    //assert
    verify(atLeast = exifTags.size) { exifInterface.getAttribute(any()) }
  }

  @Test
  fun `getFileNameAndExtension should return correct values`() {
    //arrange
    val filename = "example.dat"

    //act
    val result = MediaLibraryUtils.getFileNameAndExtension(filename)

    //assert
    assertEquals(2, result.size)
    assertEquals("example", result[0])
    assertEquals(".dat", result[1])
  }

  @Test
  fun `safeMoveFile should copy and delete`() {
    //arrange
    mockkStatic(MediaLibraryUtils::class)
    val src = mockk<File>(relaxed = true)
    val dir = mockk<File>(relaxed = true)
    every { MediaLibraryUtils.safeCopyFile(src, dir) } returns src;

    //act
    val result = MediaLibraryUtils.safeMoveFile(src, dir)

    //assert
    verifyOrder {
      MediaLibraryUtils.safeCopyFile(src, dir)
      src.delete()
    }
  }

  //TODO: safeCopyFile test

  @Test
  fun `maybeRotateAssetSize returns correct values`() {
    //arrange
    val width = 100
    val height = 200
    val nonSwappedArray = intArrayOf(width, height)
    val swappedArray = intArrayOf(height, width)

    //act
    val rotated_0 = MediaLibraryUtils.maybeRotateAssetSize(width, height, 0)
    val rotated_90 = MediaLibraryUtils.maybeRotateAssetSize(width, height, 90)
    val rotated_180 = MediaLibraryUtils.maybeRotateAssetSize(width, height, 180)
    val rotated_270 = MediaLibraryUtils.maybeRotateAssetSize(width, height, 270)
    val rotated_m90 = MediaLibraryUtils.maybeRotateAssetSize(width, height, -90)

    //assert
    assertArrayEquals(nonSwappedArray, rotated_0)
    assertArrayEquals(swappedArray, rotated_90)
    assertArrayEquals(nonSwappedArray, rotated_180)
    assertArrayEquals(swappedArray, rotated_270)
    assertArrayEquals(swappedArray, rotated_m90)
  }

  @Test
  fun `mapOrderDescriptor works with string keys`() {
    //arrange
    mockkStatic(MediaLibraryUtils::class)
    every { MediaLibraryUtils.convertSortByKey(any()) } returnsArgument 0

    val keys = listOf("key1", "key2")

    //act
    val result = MediaLibraryUtils.mapOrderDescriptor(keys)

    //assert
    assertEquals("key1 DESC,key2 DESC", result)
  }

  @Test
  fun `mapOrderDescriptor works with array keys`() {
    //arrange
    mockkStatic(MediaLibraryUtils::class)
    every { MediaLibraryUtils.convertSortByKey(any()) } returnsArgument 0

    val keys = listOf(
      arrayListOf<Any>("key1", true),
      arrayListOf<Any>("key2", false)
    )

    //act
    val result = MediaLibraryUtils.mapOrderDescriptor(keys)

    //assert
    assertEquals("key1 ASC,key2 DESC", result)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `mapOrderDescriptor throws when provided invalid types`() {
    //arrange
    val items = listOf<Any>(1, true, 3.14)

    //act
    val result = MediaLibraryUtils.mapOrderDescriptor(items)

    //assert throw
  }

  @Test(expected = IllegalArgumentException::class)
  fun `mapOrderDescriptor throws when provided invalid layout`() {
    //arrange
    val keys = listOf(
      arrayListOf<Any>("only1item"),
      arrayListOf<Any>(3, "items", "here")
    )

    //act
    val result = MediaLibraryUtils.mapOrderDescriptor(keys)

    //assert throw
  }
}
