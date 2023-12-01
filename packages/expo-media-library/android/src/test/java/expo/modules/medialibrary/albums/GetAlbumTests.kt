package expo.modules.medialibrary.albums

import android.os.Bundle
import android.provider.MediaStore.Files.FileColumns
import android.provider.MediaStore.MediaColumns
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.CursorResults
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.throwableContentResolver
import expo.modules.test.core.legacy.PromiseMock
import expo.modules.test.core.legacy.assertRejected
import expo.modules.test.core.legacy.assertRejectedWithCode
import expo.modules.test.core.legacy.promiseResolved
import expo.modules.test.core.legacy.promiseResolvedWithType
import io.mockk.justRun
import io.mockk.mockkStatic
import io.mockk.slot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.fakes.RoboCursor
import java.lang.IllegalArgumentException

private const val ALBUM_SELECTION = "${FileColumns.MEDIA_TYPE} != ${FileColumns.MEDIA_TYPE_NONE}" +
  " AND ${MediaColumns.BUCKET_DISPLAY_NAME}=?"

@RunWith(RobolectricTestRunner::class)
internal class GetAlbumTests {

  private lateinit var promise: PromiseMock
  private lateinit var mockContext: MockContext

  @Before
  fun setUp() {
    promise = PromiseMock()
    mockContext = MockContext()
  }

  @Test
  fun `GetAlbum should call queryAlbum`() {
    // arrange
    val context = mockContext.get()
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()

    mockkStatic(::queryAlbum)
    justRun {
      queryAlbum(
        context,
        capture(selectionSlot),
        capture(selectionArgsSlot),
        promise
      )
    }

    val expectedSelection = ALBUM_SELECTION
    val albumName = "TestAlbum"

    // act
    GetAlbum(context, albumName, promise).execute()

    // assert
    assertEquals(expectedSelection, selectionSlot.captured)
    assertEquals(1, selectionArgsSlot.captured.size)
    assertEquals(albumName, selectionArgsSlot.captured[0])
  }

  @Test
  fun `queryAlbum should resolve album by name`() {
    // arrange
    val context = mockContext with mockContentResolverForAlbum(
      arrayOf(
        MockData.mockAlbum.toColumnArray()
      )
    )
    val selectionArgs = arrayOf(MockData.mockAlbum.name)

    // act
    queryAlbum(context, ALBUM_SELECTION, selectionArgs, promise)

    // assert
    promiseResolved(promise) {
      assertEquals(MockData.mockAlbum.id, it.getString("id"))
      assertEquals(MockData.mockAlbum.name, it.getString("title"))
    }
  }

  @Test
  fun `queryAlbum should resolve null if album is not found`() {
    // arrange
    val context = mockContext with mockContentResolverForAlbum(emptyArray())
    val selectionArgs = arrayOf(MockData.mockAlbum.name)

    // act
    queryAlbum(context, ALBUM_SELECTION, selectionArgs, promise)

    // assert
    promiseResolvedWithType<Bundle?>(promise) { result ->
      assertNull(result)
    }
  }

  @Test
  fun `queryAlbum should reject on null cursor`() {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act
    // assert
    assertThrows(AlbumException::class.java) {
      queryAlbum(context, "", emptyArray(), promise)
    }
  }

  @Test
  fun `queryAlbum should reject on SecurityException`() {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act
    queryAlbum(context, "", emptyArray(), promise)

    // assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD_PERMISSION)
  }

  @Test
  fun `queryAlbum should reject on IllegalArgumentException`() {
    // arrange
    val context = mockContext with throwableContentResolver(IllegalArgumentException())

    // act
    queryAlbum(context, "", emptyArray(), promise)

    // assert
    assertRejected(promise)
  }

  private fun mockAlbumCursor(cursorResults: CursorResults): RoboCursor {
    val projection = arrayOf(MediaColumns.BUCKET_ID, MediaColumns.BUCKET_DISPLAY_NAME)

    return RoboCursor().apply {
      setColumnNames(projection.toMutableList())
      setResults(cursorResults)
    }
  }

  private fun mockContentResolverForAlbum(cursorResults: CursorResults) =
    mockContentResolver(mockAlbumCursor(cursorResults))
}
