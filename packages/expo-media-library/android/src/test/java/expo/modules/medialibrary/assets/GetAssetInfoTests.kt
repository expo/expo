package expo.modules.medialibrary.assets

import android.os.Bundle
import android.provider.MediaStore
import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.ERROR_IO_EXCEPTION
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockContentResolverForResult
import expo.modules.medialibrary.throwableContentResolver
import expo.modules.test.core.legacy.PromiseMock
import expo.modules.test.core.legacy.assertRejectedWithCode
import expo.modules.test.core.legacy.promiseResolvedWithType
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.slot
import junit.framework.ComparisonFailure
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException

private fun assertListsEqual(first: List<*>?, second: List<*>?, message: String = "") {
  if (first == second) return

  if (first == null || second == null) {
    throw throw ComparisonFailure(message, first.toString(), second.toString())
  }

  if (!first.toTypedArray().contentDeepEquals(second.toTypedArray())) {
    throw ComparisonFailure(message, first.toString(), second.toString())
  }
}

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
    GetAssetInfo(context, assetId, promise).execute()

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
    // assert
    assertThrows(AssetQueryException::class.java) {
      queryAssetInfo(context, "", emptyArray(), false, promise)
    }
  }

  @Test
  fun `queryAssetInfo should reject on SecurityException`() {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act
    queryAssetInfo(context, "", emptyArray(), false, promise)
    // assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD_PERMISSION)
  }

  @Test
  fun `queryAssetInfo should reject on IOException`() {
    // arrange
    val context = mockContext with throwableContentResolver(IOException())

    // act
    queryAssetInfo(context, "", emptyArray(), false, promise)

    // assert
    assertRejectedWithCode(promise, ERROR_IO_EXCEPTION)
  }
}
