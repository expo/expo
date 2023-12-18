package expo.modules.medialibrary.assets

import android.provider.MediaStore
import expo.modules.medialibrary.AssetsOptions
import expo.modules.medialibrary.MediaType
import expo.modules.medialibrary.SortBy
import io.mockk.clearAllMocks
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class GetAssetsQueryTests {
  @After
  fun tearDown() {
    clearAllMocks()
  }

  @Test
  fun `test if AssetOptions are handled correctly`() {
    // arrange
    val limit = 21.0
    val offset = "37"
    val album = "sampleAlbumId"
    val createdBefore = 6789.0
    val createdAfter = 2345.0

    val options = AssetsOptions(
      first = limit,
      after = "37",
      createdBefore = 6789.0,
      createdAfter = 2345.0,
      album = "sampleAlbumId",
      mediaType = listOf(MediaType.PHOTO.apiName),
      sortBy = listOf("${SortBy.DEFAULT.keyName} ASC")
    )

    val expectedSelection = "${MediaStore.Images.Media.BUCKET_ID} = $album" +
      " AND ${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (${MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE})" +
      " AND ${MediaStore.Images.Media.DATE_TAKEN} > ${createdAfter.toLong()}" +
      " AND ${MediaStore.Images.Media.DATE_TAKEN} < ${createdBefore.toLong()}"

    val expectedOrder = convertOrderDescriptors(options.sortBy)

    // act
    val queryInfo = getQueryFromOptions(options)

    // assert
    assertEquals(limit, queryInfo.limit, 0.0)
    assertEquals(offset.toInt(), queryInfo.offset)
    assertEquals(expectedSelection, queryInfo.selection)
    assertEquals(expectedOrder, queryInfo.order)
  }

  @Test
  fun `test if no input gives default values`() {
    // arrange
    val expectedSelection = "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}"

    val options = AssetsOptions(
      first = 20.0,
      after = null,
      createdBefore = null,
      createdAfter = null,
      album = null,
      mediaType = emptyList(),
      sortBy = emptyList()
    )
    // act
    val queryInfo = getQueryFromOptions(options)

    // assert
    assertEquals(0, queryInfo.offset)
    assertEquals(expectedSelection, queryInfo.selection)
    assertEquals(MediaStore.Images.Media.DEFAULT_SORT_ORDER, queryInfo.order)
  }

  @Test
  fun `test if invalid arguments fall back to defaults`() {
    // arrange
    val limitOutOfRange = -123.0

    val options = AssetsOptions(
      first = limitOutOfRange,
      after = "invalidStringValue",
      createdBefore = null,
      createdAfter = null,
      album = null,
      mediaType = emptyList(),
      sortBy = emptyList()
    )

    // act
    val queryInfo = getQueryFromOptions(options)

    // assert
    assertEquals(limitOutOfRange.toInt(), queryInfo.limit.toInt())
    assertEquals(0, queryInfo.offset)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `test if invalid mediaType throws`() {
    val options = AssetsOptions(
      first = 21.0,
      after = "invalidStringValue",
      createdBefore = null,
      createdAfter = null,
      album = null,
      mediaType = listOf("someRandomString"),
      sortBy = emptyList()
    )

    getQueryFromOptions(options)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `test if invalid order throws`() {
    val options = AssetsOptions(
      first = 21.0,
      after = "invalidStringValue",
      createdBefore = null,
      createdAfter = null,
      album = null,
      mediaType = emptyList(),
      sortBy = listOf("invalid name")
    )

    getQueryFromOptions(options)
  }

  class ConvertOrderDescriptorTests {
    @Test(expected = IllegalArgumentException::class)
    fun `convertOrderDescriptors throws when provided invalid types`() {
      // arrange
      val items = listOf("date", "time")

      // act
      convertOrderDescriptors(items)

      // assert throw
    }

    @Test(expected = IllegalArgumentException::class)
    fun `convertOrderDescriptors throws when provided invalid layout`() {
      // arrange
      val keys = listOf(
        "only1item",
        "with three items"
      )

      // act
      convertOrderDescriptors(keys)

      // assert throw
    }
  }
}
