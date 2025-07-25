package expo.modules.medialibrary.albums

import android.os.Bundle
import android.provider.MediaStore
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockCursor
import expo.modules.medialibrary.throwableContentResolver
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class GetAlbumInfoTests {

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

    val expectedSelection = "${MediaStore.Images.Media.BUCKET_DISPLAY_NAME}=?"
    val albumName = "testAlbumName"

    // act
    GetAlbum(context, albumName).execute()

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
    val result = queryAlbum(context, selection, selectionArgs)

    // assert
    result?.let {
      assertEquals(bucketDisplayName, it.getString("title"))
      assertEquals(2, it.getInt("assetCount"))
      assertEquals(MockData.MOCK_ALBUM_ID, it.getString("id"))
    } ?: fail()
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
}
