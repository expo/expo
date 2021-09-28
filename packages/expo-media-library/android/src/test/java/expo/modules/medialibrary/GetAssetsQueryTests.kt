package expo.modules.medialibrary

import android.provider.MediaStore
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class GetAssetsQueryTests {

  @Test
  fun `test if proper values are handled properly`() {
    // arrange
    val limit = 21.0
    val offset = "37"
    val album = "sampleAlbumId"
    val mediaTypes = listOf(MediaLibraryConstants.MEDIA_TYPE_PHOTO)
    val createdBefore = 6789.0
    val createdAfter = 2345.0
    val sortBy = listOf(
      ArrayList(listOf(MediaLibraryConstants.SORT_BY_DEFAULT, true))
    )

    val inputMap = mapOf(
      "first" to limit,
      "after" to offset,
      "createdBefore" to createdBefore,
      "createdAfter" to createdAfter,
      "album" to album,
      "mediaType" to mediaTypes,
      "sortBy" to sortBy
    )

    val expectedSelection = "${MediaStore.Images.Media.BUCKET_ID} = $album" +
      " AND ${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (${MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE})" +
      " AND ${MediaStore.Images.Media.DATE_TAKEN} > ${createdAfter.toLong()}" +
      " AND ${MediaStore.Images.Media.DATE_TAKEN} < ${createdBefore.toLong()}"

    val expectedOrder = MediaLibraryUtils.mapOrderDescriptor(sortBy)

    // act
    val queryInfo = getQueryFromAssetOptions(inputMap)

    // assert
    assertEquals(limit.toInt(), queryInfo.limit)
    assertEquals(offset.toInt(), queryInfo.offset)
    assertEquals(expectedSelection, queryInfo.selection)
    assertEquals(expectedOrder, queryInfo.order)
  }

  @Test
  fun `test if no input gives default values`() {
    // arrange
    val expectedSelection = "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}"

    // act
    val queryInfo = getQueryFromAssetOptions(emptyMap())

    // assert
    assertEquals(20, queryInfo.limit)
    assertEquals(0, queryInfo.offset)
    assertEquals(expectedSelection, queryInfo.selection)
    assertEquals(MediaStore.Images.Media.DEFAULT_SORT_ORDER, queryInfo.order)
  }

  @Test
  fun `test if invalid arguments fall back to defaults`() {
    // arrange
    val limitOutOfRange = -123.0

    val inputMap = mapOf(
      "first" to limitOutOfRange,
      "after" to "invalidStringValue"
    )

    // act
    val queryInfo = getQueryFromAssetOptions(inputMap)

    // assert
    assertEquals(limitOutOfRange.toInt(), queryInfo.limit)
    assertEquals(0, queryInfo.offset)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `test if invalid mediaType throws`() {
    val inputMap = mapOf(
      "mediaType" to listOf("someRandomString")
    )

    val queryInfo = getQueryFromAssetOptions(inputMap)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `test if invalid order throws`() {
    val inputMap = mapOf(
      "sortBy" to listOf("invalid name")
    )

    val queryInfo = getQueryFromAssetOptions(inputMap)
  }
}
