package expo.modules.medialibrary.albums

import android.provider.MediaStore
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockCursor
import expo.modules.medialibrary.throwableContentResolver
import expo.modules.test.core.legacy.PromiseMock
import expo.modules.test.core.legacy.assertRejectedWithCode
import expo.modules.test.core.legacy.promiseResolved
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.runs
import io.mockk.slot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class GetAlbumInfoTests {

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
    every {
      queryAlbum(
        context,
        capture(selectionSlot),
        capture(selectionArgsSlot),
        promise
      )
    } just runs

    val expectedSelection = "${MediaStore.Images.Media.BUCKET_DISPLAY_NAME}=?"
    val albumName = "testAlbumName"

    // act
    GetAlbum(context, albumName, promise).execute()

    // assert
    assertTrue(selectionSlot.captured.contains(expectedSelection, ignoreCase = true))
    assertEquals(1, selectionArgsSlot.captured.size)
    assertEquals(albumName, selectionArgsSlot.captured[0])
  }

  @Test
  fun `queryAlbum returns correct values`() {
    // arrange
    val bucketDisplayName = "Some Album Name"
    val selection = MediaStore.Images.Media.BUCKET_DISPLAY_NAME + "=?"
    val selectionArgs = arrayOf(bucketDisplayName)

    val cursor = mockCursor(
      arrayOf(
        arrayOf(*MockData.mockImage.toColumnArray(), bucketDisplayName),
        arrayOf(*MockData.mockVideo.toColumnArray(), bucketDisplayName)
      )
    )
    cursor.setColumnNames(arrayListOf(*cursor.columnNames, MediaStore.Images.Media.BUCKET_DISPLAY_NAME))

    val context = mockContext with mockContentResolver(cursor)

    // act
    queryAlbum(context, selection, selectionArgs, promise)

    // assert
    promiseResolved(promise) {
      assertEquals(bucketDisplayName, it.getString("title"))
      assertEquals(2, it.getInt("assetCount"))
      assertEquals(MockData.MOCK_ALBUM_ID, it.getString("id"))
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
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD)
  }
}
