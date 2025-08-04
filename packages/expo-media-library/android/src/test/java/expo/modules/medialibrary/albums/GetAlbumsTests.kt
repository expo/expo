package expo.modules.medialibrary.albums

import android.provider.MediaStore.Images.Media
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.MockContext
import expo.modules.medialibrary.MockData
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.mockContentResolver
import expo.modules.medialibrary.mockCursor
import expo.modules.medialibrary.throwableContentResolver
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class GetAlbumsTests {

  private lateinit var mockContext: MockContext

  @Before
  fun setUp() {
    mockContext = MockContext()
  }

  @Test
  fun `GetAlbums should resolve with correct response`() {
    // arrange
    val bucketDisplayName = "Some Album Name"

    val cursor = mockCursor(
      arrayOf(
        arrayOf(*MockData.mockImage.toColumnArray(), bucketDisplayName),
        arrayOf(*MockData.mockVideo.toColumnArray(), bucketDisplayName)
      )
    )
    cursor.setColumnNames(arrayListOf(*cursor.columnNames, Media.BUCKET_DISPLAY_NAME))

    val context = mockContext with mockContentResolver(cursor)

    // act
    val result = getAlbums(context)

    // assert
    assertEquals(1, result.size)
    val firstAlbum = result[0]
    assertEquals(MockData.MOCK_ALBUM_ID, firstAlbum.getString("id"))
    assertEquals(2, firstAlbum.getInt("assetCount"))
    assertEquals(bucketDisplayName, firstAlbum.getString("title"))
  }

  @Test
  fun `GetAlbums should not list albums with null name`() {
    // arrange
    val bucketId = 123456
    val bucketDisplayName = null

    val cursor = mockCursor(
      arrayOf(
        arrayOf(bucketId, bucketDisplayName)
      )
    )
    cursor.setColumnNames(arrayListOf(Media.BUCKET_ID, Media.BUCKET_DISPLAY_NAME))

    val context = mockContext with mockContentResolver(cursor)

    // act
    val result = getAlbums(context)

    // assert
    assertEquals(0, result.size)
  }

  @Test
  fun `GetAlbums should reject on null cursor`() {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act && assert
    assertThrows(AlbumException::class.java) {
      getAlbums(context)
    }
  }

  @Test
  fun `GetAlbums should reject on SecurityException`() {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act && assert
    try {
      getAlbums(context)
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
  }

  @Test
  fun `GetAlbums should reject on IllegalArgumentException`() {
    // arrange
    val context = mockContext with throwableContentResolver(IllegalArgumentException())

    // act && assert
    try {
      getAlbums(context)
      fail()
    } catch (e: Exception) {
      assert(e is UnableToLoadException)
    }
  }
}
