package expo.modules.medialibrary

import android.content.Context
import android.os.Bundle
import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.core.Promise
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertRejectedWithCode
import org.unimodules.test.core.promiseResolvedWithType

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
    //arrange
    val bucketDisplayName = "Some Album Name"

    val cursor = mockCursor(arrayOf(
      arrayOf(*MockData.mockImage.toColumnArray(), bucketDisplayName),
      arrayOf(*MockData.mockVideo.toColumnArray(), bucketDisplayName)
    ))
    cursor.setColumnNames(arrayListOf(*cursor.columnNames, MediaStore.Images.Media.BUCKET_DISPLAY_NAME))

    val context = mockContext with mockContentResolver(cursor)

    //act
    TestGetAlbums(context, promise).execute()

    //assert
    promiseResolvedWithType<List<Bundle>>(promise) {
      assertEquals(1, it.size)

      val firstAlbum = it[0]
      assertEquals(MockData.MOCK_ALBUM_ID, firstAlbum.getString("id"))
      assertEquals(2, firstAlbum.getInt("assetCount"))
      assertEquals(bucketDisplayName, firstAlbum.getString("title"))
    }
  }

  @Test
  fun `GetAlbums should reject on null cursor`() {
    //arrange
    val context = mockContext with mockContentResolver(null)

    //act
    TestGetAlbums(context, promise).execute()

    //assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD)
  }

  @Test
  fun `GetAlbums should reject on SecurityException`() {
    //arrange
    val context = mockContext with throwableContentResolver(SecurityException())

    //act
    TestGetAlbums(context, promise).execute()

    //assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD_PERMISSION)
  }

  @Test
  fun `GetAlbums should reject on IllegalArgumentException`() {
    //arrange
    val context = mockContext with throwableContentResolver(IllegalArgumentException())

    //act
    TestGetAlbums(context, promise).execute()

    //assert
    assertRejectedWithCode(promise, ERROR_UNABLE_TO_LOAD)
  }

  // hack for calling protected methods.
  private class TestGetAlbums(mContext: Context, mPromise: Promise) : GetAlbums(mContext, mPromise) {
    fun execute() = doInBackground()
  }
}
