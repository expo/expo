package expo.modules.medialibrary.albums

import android.os.Bundle
import android.provider.MediaStore.Images.Media
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
import expo.modules.test.core.legacy.promiseResolvedWithType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class GetAlbumsTests {

  private lateinit var promise: PromiseMock
  private lateinit var mockContext: MockContext

  @Before
  fun setUp() {
    promise = PromiseMock()
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
    GetAlbums(context, promise).execute()

    // assert
    promiseResolvedWithType<List<Bundle>>(promise) {
      assertEquals(1, it.size)

      val firstAlbum = it[0]
      assertEquals(MockData.MOCK_ALBUM_ID, firstAlbum.getString("id"))
      assertEquals(2, firstAlbum.getInt("assetCount"))
      assertEquals(bucketDisplayName, firstAlbum.getString("title"))
    }
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
    GetAlbums(context, promise).execute()

    // assert
    promiseResolvedWithType<List<Bundle>>(promise) {
      assertEquals(0, it.size)
    }
  }

  @Test
  fun `GetAlbums should reject on null cursor`() {
    // arrange
    val context = mockContext with mockContentResolver(null)

    // act
    // assert
    assertThrows(AlbumException::class.java) {
      GetAlbums(context, promise).execute()
    }
  }

  @Test
  fun `GetAlbums should reject on SecurityException`() {
    // arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    // act
    GetAlbums(context, promise).execute()

    // assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD_PERMISSION)
  }

  @Test
  fun `GetAlbums should reject on IllegalArgumentException`() {
    // arrange
    val context = mockContext with throwableContentResolver(IllegalArgumentException())

    // act
    GetAlbums(context, promise).execute()

    // assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD)
  }
}
