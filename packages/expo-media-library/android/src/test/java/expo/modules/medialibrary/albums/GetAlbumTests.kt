package expo.modules.medialibrary.albums

import android.os.Bundle
import android.provider.MediaStore.Files.FileColumns
import android.provider.MediaStore.MediaColumns
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.CursorResults
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.throwableContentResolver
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.fail
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

  private lateinit var mockContext: MockContext

  @Before
  fun setUp() {
    mockContext = MockContext()
  }

  @Test
  fun `GetAlbum should call queryAlbum`() {
    // arrange
    val context = mockContext.get()
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()

    mockkStatic(::queryAlbum)
    every {
      queryAlbum(
        context,
        capture(selectionSlot),
        capture(selectionArgsSlot)
      )
    } returns mockk<Bundle>(relaxed = true)

    val expectedSelection = ALBUM_SELECTION
    val albumName = "TestAlbum"

    // act
    GetAlbum(context, albumName).execute()

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
    val result = queryAlbum(context, ALBUM_SELECTION, selectionArgs)

    // assert
    result?.let {
      assertEquals(MockData.mockAlbum.id, it.getString("id"))
      assertEquals(MockData.mockAlbum.name, it.getString("title"))
    } ?: fail()
  }

  @Test
  fun `queryAlbum should resolve null if album is not found`() {
    // arrange
    val context = mockContext with mockContentResolverForAlbum(emptyArray())
    val selectionArgs = arrayOf(MockData.mockAlbum.name)

    // act
    val result = queryAlbum(context, ALBUM_SELECTION, selectionArgs)

    // assert
    assertNull(result)
  }

  @Test
  fun `queryAlbum should reject on null cursor`() {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act && assert
    assertThrows(AlbumException::class.java) {
      queryAlbum(context, "", emptyArray())
    }
  }

  @Test
  fun `queryAlbum should reject on SecurityException`() {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act && assert
    try {
      queryAlbum(context, "", emptyArray())
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
  }

  @Test
  fun `queryAlbum should reject on IllegalArgumentException`() {
    // arrange
    val context = mockContext with throwableContentResolver(IllegalArgumentException())

    // act && assert
    try {
      queryAlbum(context, "", emptyArray())
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
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
