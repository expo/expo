package expo.modules.medialibrary.assets

import android.provider.MediaStore
import expo.modules.core.utilities.ifNull
import expo.modules.medialibrary.AssetsOptions
import expo.modules.medialibrary.MediaType
import expo.modules.medialibrary.SortBy

data class GetAssetsQuery(
  val selection: String,
  val order: String,
  val limit: Double,
  val offset: Int,
)

@Throws(IllegalArgumentException::class)
internal fun getQueryFromOptions(input: AssetsOptions): GetAssetsQuery {
  val limit = input.first

  // to maintain compatibility with iOS field `after` is string
  val offset = input.after
    ?.runCatching { toInt() } // NumberFormatException
    ?.getOrNull()
    ?: 0

  val selection = createSelectionString(input)

  val order = if (input.sortBy.isNotEmpty()) {
    convertOrderDescriptors(input.sortBy)
  } else {
    MediaStore.Images.Media.DEFAULT_SORT_ORDER
  }

  return GetAssetsQuery(selection, order, limit, offset)
}

@Throws(IllegalArgumentException::class)
private fun createSelectionString(input: AssetsOptions): String {
  val selectionBuilder = StringBuilder()

  input.album?.let {
    selectionBuilder.append("${MediaStore.Images.Media.BUCKET_ID} = ${input.album}")
    selectionBuilder.append(" AND ")
  }

  val mediaType = input.mediaType
  if (mediaType.isNotEmpty() && !mediaType.contains(MediaType.ALL.apiName)) {
    val mediaTypeInts = mediaType.map { parseMediaType(it) }
    selectionBuilder.append(
      "${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (${mediaTypeInts.joinToString(separator = ",")})"
    )
  } else {
    selectionBuilder.append(
      "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}"
    )
  }

  input.createdAfter?.let {
    selectionBuilder.append(" AND ${MediaStore.Images.Media.DATE_TAKEN} > ${it.toLong()}")
  }
  input.createdBefore?.let {
    selectionBuilder.append(" AND ${MediaStore.Images.Media.DATE_TAKEN} < ${it.toLong()}")
  }

  return selectionBuilder.toString()
}

/**
 * Converts media type constant string to media column defined in [MediaType]
 * @throws IllegalArgumentException if the value is not defined there
 */
@Throws(IllegalArgumentException::class)
private fun parseMediaType(mediaTypeName: String): Int =
  MediaType.fromApiName(mediaTypeName)?.mediaColumn.ifNull {
    val errorMessage = "MediaType $mediaTypeName is not supported!"
    throw IllegalArgumentException(errorMessage)
  }

/**
 * Converts sorting key string to column value defined in [SortBy]
 * @throws IllegalArgumentException if the value is not defined there
 */
@Throws(IllegalArgumentException::class)
fun parseSortByKey(key: String): String =
  SortBy.fromKeyName(key)?.mediaColumnName.ifNull {
    val errorMessage = "SortBy key $key is not supported!"
    throw IllegalArgumentException(errorMessage)
  }

/**
 * Converts orderBy options to a value accepted as `order` parameter of
 * [android.content.ContentResolver.query] method
 *
 * Expected input: List of either:
 * - `String` representing order key, defined in [MediaLibraryConstants.SORT_KEYS]
 * - Two-element tuple (defined as `List[String, Boolean]`), where:
 *    - first element represents order key, defined in [MediaLibraryConstants.SORT_KEYS]
 *    - second element: `true` --> ASC, `false` --> DESC order
 *
 * @throws IllegalArgumentException when conversion fails
 */
@Throws(IllegalArgumentException::class)
fun convertOrderDescriptors(orderDescriptor: List<String>): String {
  val results = ArrayList<String>(20)
  for (item in orderDescriptor) {
    val parts = item.split(" ")
    require(parts.size == 2) { "Array sortBy in assetsOptions has invalid layout." }

    val key = parseSortByKey(parts[0])
    val order = parts[1]
    results.add("$key $order")
  }
  return results.joinToString(separator = ",")
}
