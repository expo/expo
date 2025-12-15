package expo.modules.medialibrary.assets

import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.AssetsOptions
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockContentResolverForResult
import expo.modules.medialibrary.throwableContentResolver
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.runs
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
internal class GetAssetsTest {

  private lateinit var mockContext: MockContext

  private val defaultAssets
    get() = AssetsOptions(
      first = 0.0,
      after = null,
      createdAfter = null,
      createdBefore = null,
      sortBy = emptyList(),
      mediaType = emptyList(),
      album = null,
      resolveWithFullInfo = false
    )

  @Before
  fun setUp() {
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
  fun `getAssets should resolve with correct response`() = runTest {
    // arrange
    val context = mockContext with mockContentResolverForResult(
      arrayOf(
        MockData.mockImage.toColumnArray(),
        MockData.mockVideo.toColumnArray()
      )
    )

    // act
    val response = getAssets(context, defaultAssets)

    // assert
    assertEquals(2, response.getInt("totalCount"))
  }

  @Test
  fun `GetAssets should reject on null cursor`() = runTest {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act && assert
    try {
      getAssets(context, defaultAssets)
      fail()
    } catch (e: Exception) {
      assert(e is AssetQueryException)
    }
  }

  @Test
  fun `GetAssets should reject on SecurityException`() = runTest {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act && assert
    try {
      getAssets(context, defaultAssets)
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
  }

  @Test
  fun `GetAssets should reject on IOException`() = runTest {
    // arrange
    val context = mockContext with throwableContentResolver(IOException())

    // act && assert
    try {
      getAssets(context, defaultAssets)
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
  }
}
