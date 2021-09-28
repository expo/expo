package expo.modules.medialibrary.assets

import android.os.Bundle
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryConstants
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockContentResolverForResult
import expo.modules.medialibrary.throwableContentResolver
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.slot
import io.mockk.unmockkStatic
import org.junit.After
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

  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `GetAssetInfo should call queryAssetInfo`() {
    // arrange
    val context = mockContext.get()
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()

    mockkStatic(::queryAssetInfo)
    every {
      queryAssetInfo(
          context,
          capture(selectionSlot),
          capture(selectionArgsSlot),
          true,
          promise
      )
    } just runs

    val expectedSelection = "${MediaStore.Images.Media._ID}=?"
    val assetId = "testAssetId"

    // act
    GetAssetInfo(context, assetId, promise).doInBackground()

    // assert
    assertEquals(expectedSelection, selectionSlot.captured)
    assertEquals(1, selectionArgsSlot.captured.size)
    assertEquals(assetId, selectionArgsSlot.captured[0])
  }

  @Test
  fun `queryAssetInfo should resolve asset`() {
    // arrange
    val context = mockContext with mockContentResolverForResult(
      arrayOf(
        MockData.mockImage.toColumnArray()
      )
    )

    mockkStatic(MediaLibraryUtils::class)
    every {
      putAssetsInfo(any(), any(), any(), any(), any(), any())
    } just runs

    val selection = "${MediaStore.Images.Media._ID}=?"
    val selectionArgs = arrayOf(MockData.mockImage.id.toString())

    // act
    queryAssetInfo(context, selection, selectionArgs, false, promise)

    // assert
    promiseResolvedWithType<ArrayList<Bundle>>(promise) {
      assertListsEqual(emptyList<Bundle>(), it)
    }
  }

  @Test
  fun `queryAssetInfo should reject on null cursor`() {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act
    queryAssetInfo(context, "", emptyArray(), false, promise)

    // assert
    assertRejected(promise)
  }

  @Test
  fun `queryAssetInfo should reject on SecurityException`() {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act
    queryAssetInfo(context, "", emptyArray(), false, promise)

    // assert
    assertRejectedWithCode(promise, MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION)
  }

  @Test
  fun `queryAssetInfo should reject on IOException`() {
    // arrange
    val context = mockContext with throwableContentResolver(IOException())

    // act
    queryAssetInfo(context, "", emptyArray(), false, promise)

    // assert
    assertRejectedWithCode(promise, MediaLibraryConstants.ERROR_IO_EXCEPTION)
  }
}
