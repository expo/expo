package expo.modules.medialibrary

import android.os.Bundle
import android.provider.MediaStore
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.verify
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertListsEqual
import org.unimodules.test.core.assertRejected
import org.unimodules.test.core.promiseRejected
import org.unimodules.test.core.promiseResolvedWithType
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
internal class AssetsContentResolverTests {

  private lateinit var promise: PromiseMock
  private lateinit var mockContext: MockContext

  @Before
  fun setUp() {
    promise = PromiseMock()
    mockContext = MockContext()
  }

  @Test
  fun `putAssetsInfo returns correct response when fullInfo=false`() {
    //arrange
    val cursor = mockCursor(arrayOf(
      MockData.mockVideo.toColumnArray(),
      MockData.mockAudio.toColumnArray()
    ))

    val contentResolver = mockContentResolver(cursor)

    mockkStatic(MediaLibraryUtils::class)
    every {
      MediaLibraryUtils.getSizeFromCursor(contentResolver, any(), cursor, any(), any())
    } returns intArrayOf(0, 0) andThen intArrayOf(100, 200)


    //act
    val result = arrayListOf<Bundle>()
    MediaLibraryUtils.putAssetsInfo(contentResolver, cursor, result, 5, 0, false)


    //assert
    verify(exactly = 0) {
      MediaLibraryUtils.getExifLocation(any(), any())
      MediaLibraryUtils.getExifLocation(any(), any())
    }

    Assert.assertEquals(2, result.size)

    Assert.assertEquals(MockData.mockVideo.id.toString(), result[0].getString("id"))
    Assert.assertEquals("file://${MockData.mockVideo.path}", result[0].getString("uri"))

    Assert.assertNull(result[0].getString("localUri"))
  }

  @Test
  fun `queryAssetInfo should resolve asset`() {
    //arrange
    val context = mockContext with mockContentResolverForResult(arrayOf(
      MockData.mockImage.toColumnArray()
    ))

    mockkStatic(MediaLibraryUtils::class)
    every {
      MediaLibraryUtils.putAssetsInfo(any(), any(), any(), any(), any(), any())
    } just runs

    val selection = "${MediaStore.Images.Media._ID}=?"
    val selectionArgs = arrayOf(MockData.mockImage.id.toString())

    //act
    MediaLibraryUtils.queryAssetInfo(context, selection, selectionArgs, false, promise)

    //assert
    promiseResolvedWithType<ArrayList<Bundle>>(promise) {
      assertListsEqual(emptyList<Bundle>(), it)
    }
  }

  @Test
  fun `queryAssetInfo should reject on null cursor`() {
    //arrange
    val context = mockContext with mockContentResolver(null)

    //act
    MediaLibraryUtils.queryAssetInfo(context, "", emptyArray(), false, promise)

    //assert
    assertRejected(promise)
  }

  @Test
  fun `queryAssetInfo should reject on SecurityException`() {
    //arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    //act
    MediaLibraryUtils.queryAssetInfo(context, "", emptyArray(), false, promise)

    //assert
    promiseRejected(promise) {
      Assert.assertEquals(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION, it.rejectCode)
    }
  }

  @Test
  fun `queryAssetInfo should reject on IOException`() {
    //arrange
    val context = mockContext with throwableContentResolver(IOException())

    //act
    MediaLibraryUtils.queryAssetInfo(context, "", emptyArray(), false, promise)

    //assert
    promiseRejected(promise) {
      Assert.assertEquals(MediaLibraryConstants.ERROR_IO_EXCEPTION, it.rejectCode)
    }
  }
}
