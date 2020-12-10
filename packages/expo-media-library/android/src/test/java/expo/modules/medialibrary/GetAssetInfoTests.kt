package expo.modules.medialibrary

import android.os.Bundle
import android.provider.MediaStore
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.slot
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertListsEqual
import org.unimodules.test.core.assertRejected
import org.unimodules.test.core.assertRejectedWithCode
import org.unimodules.test.core.promiseResolvedWithType
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
internal class GetAssetInfoTests {

  private lateinit var promise: PromiseMock
  private lateinit var mockContext: MockContext

  @Before
  fun setUp() {
    promise = PromiseMock()
    mockContext = MockContext()
  }

  @Test
  fun `GetAssetInfo should call queryAssetInfo`() {
    //arrange
    val context = mockContext.get()
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()

    mockkStatic(MediaLibraryUtils::class)
    every { MediaLibraryUtils.queryAssetInfo(
      context,
      capture(selectionSlot),
      capture(selectionArgsSlot),
      true,
      promise
    ) } just runs

    val expectedSelection = "${MediaStore.Images.Media._ID}=?"
    val assetId = "testAssetId"

    //act
    GetAssetInfo(context, assetId, promise).doInBackground()

    //assert
    assertEquals(expectedSelection, selectionSlot.captured)
    assertEquals(1, selectionArgsSlot.captured.size)
    assertEquals(assetId, selectionArgsSlot.captured[0])
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
    assertRejectedWithCode(promise, MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION)
  }

  @Test
  fun `queryAssetInfo should reject on IOException`() {
    //arrange
    val context = mockContext with throwableContentResolver(IOException())

    //act
    MediaLibraryUtils.queryAssetInfo(context, "", emptyArray(), false, promise)

    //assert
    assertRejectedWithCode(promise, MediaLibraryConstants.ERROR_IO_EXCEPTION)
  }
}
