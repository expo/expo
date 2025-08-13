package expo.modules.medialibrary.assets

import android.os.Bundle
import android.provider.MediaStore
import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockContentResolverForResult
import expo.modules.medialibrary.throwableContentResolver
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.slot
import junit.framework.ComparisonFailure
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
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

  private lateinit var mockContext: MockContext

  @Before
  fun setUp() {
    mockContext = MockContext()
  }

  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `getAssetInfo should call queryAssetInfo`() = runTest {
    // arrange
    val context = mockContext.get()
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()

    mockkStatic(::queryAssetInfo)
    coEvery {
      queryAssetInfo(
        context,
        capture(selectionSlot),
        capture(selectionArgsSlot),
        true
      )
    } returns mockk<ArrayList<Bundle>>(relaxed = true)

    val expectedSelection = "${MediaStore.Images.Media._ID}=?"
    val assetId = "testAssetId"

    // act
    getAssetInfo(context, assetId)

    // assert
    assertEquals(expectedSelection, selectionSlot.captured)
    assertEquals(1, selectionArgsSlot.captured.size)
    assertEquals(assetId, selectionArgsSlot.captured[0])
  }

  @Test
  fun `queryAssetInfo should resolve asset`() = runTest {
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
    val result = queryAssetInfo(context, selection, selectionArgs, false)

    // assert
    result?.let {
      assertListsEqual(emptyList<Bundle>(), result)
    } ?: fail()
  }

  @Test
  fun `queryAssetInfo should reject on null cursor`() = runTest {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act && assert
    try {
      queryAssetInfo(context, "", emptyArray(), false)
      fail()
    } catch (e: Exception) {
      assert(e is AssetQueryException)
    }
  }

  @Test
  fun `queryAssetInfo should reject on SecurityException`() = runTest {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act && assert
    try {
      queryAssetInfo(context, "", emptyArray(), false)
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
  }

  @Test
  fun `queryAssetInfo should reject on IOException`() = runTest {
    // arrange
    val context = mockContext with throwableContentResolver(IOException())

    // act && assert
    try {
      queryAssetInfo(context, "", emptyArray(), false)
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
  }
}
