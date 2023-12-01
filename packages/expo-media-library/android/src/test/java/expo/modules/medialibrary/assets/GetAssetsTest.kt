package expo.modules.medialibrary.assets

import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.AssetsOptions
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockContentResolverForResult
import expo.modules.medialibrary.throwableContentResolver
import expo.modules.test.core.legacy.PromiseMock
import expo.modules.test.core.legacy.assertRejectedWithCode
import expo.modules.test.core.legacy.promiseResolved
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.runs
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
internal class GetAssetsTest {

  private lateinit var promise: PromiseMock
  private lateinit var mockContext: MockContext

  private val defaultAssets
    get() = AssetsOptions(
      first = 0.0,
      after = null,
      createdAfter = null,
      createdBefore = null,
      sortBy = emptyList(),
      mediaType = emptyList(),
      album = null
    )

  @Before
  fun setUp() {
    promise = PromiseMock()
    mockContext = MockContext()

    mockkStatic(::getQueryFromOptions)
    every { getQueryFromOptions(any()) } returns GetAssetsQuery(selection = "", order = "", limit = 10.0, offset = 0)

    mockkStatic(::putAssetsInfo)
    every { putAssetsInfo(any(), any(), any(), any(), any(), any()) } just runs
  }

  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `getAssets should resolve with correct response`() {
    // arrange
    val context = mockContext with mockContentResolverForResult(
      arrayOf(
        MockData.mockImage.toColumnArray(),
        MockData.mockVideo.toColumnArray()
      )
    )

    // act
    GetAssets(context, defaultAssets, promise).execute()

    // assert
    promiseResolved(promise) {
      assertEquals(2, it.getInt("totalCount"))
    }
  }

  @Test
  fun `GetAssets should reject on null cursor`() {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act
    // assert
    assertThrows(AssetQueryException::class.java) {
      GetAssets(context, defaultAssets, promise).execute()
    }
  }

  @Test
  fun `GetAssets should reject on SecurityException`() {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act
    GetAssets(context, defaultAssets, promise).execute()

    // assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD_PERMISSION)
  }

  @Test
  fun `GetAssets should reject on IOException`() {
    // arrange
    val context = mockContext with throwableContentResolver(IOException())

    // act
    GetAssets(context, defaultAssets, promise).execute()

    // assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD)
  }
}
