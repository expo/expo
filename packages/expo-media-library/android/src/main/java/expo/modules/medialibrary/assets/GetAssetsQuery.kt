package expo.modules.medialibrary.assets

import android.provider.MediaStore
import expo.modules.medialibrary.MediaLibraryConstants
import expo.modules.medialibrary.takeIfInstanceOf
import java.util.ArrayList

data class GetAssetsQuery(
  val selection: String,
  val order: String,
  val limit: Int,
  val offset: Int,
)

@Throws(IllegalArgumentException::class)
internal fun getQueryFromOptions(input: Map<String, Any?>): GetAssetsQuery {
  val limit = input["first"].takeIfInstanceOf<Number>()?.toInt() ?: 20

  // to maintain compatibility with iOS field `after` is string
  val offset = input["after"]
    .takeIfInstanceOf<String>()
    ?.runCatching { toInt() } // NumberFormatException
    ?.getOrNull()
    ?: 0

  val selection = createSelectionString(input)

  val sortBy = input["sortBy"].takeIfInstanceOf<List<*>>()
  val order = if (sortBy != null && sortBy.isNotEmpty()) {
    convertOrderDescriptors(sortBy)
  } else {
    MediaStore.Images.Media.DEFAULT_SORT_ORDER
  }

  return GetAssetsQuery(selection, order, limit, offset)
}

@Throws(IllegalArgumentException::class)
private fun createSelectionString(input: Map<String, Any?>): String {
  val selectionBuilder = StringBuilder()

  if (input.containsKey("album")) {
    selectionBuilder.append("${MediaStore.Images.Media.BUCKET_ID} = ${input["album"]}")
    selectionBuilder.append(" AND ")
  }

  val mediaType = input["mediaType"].takeIfInstanceOf<List<*>>()
  if (mediaType != null && !mediaType.contains(MediaLibraryConstants.MEDIA_TYPE_ALL)) {

    val mediaTypeInts = mediaType.map { parseMediaType(it.toString()) }
    selectionBuilder.append("${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (${mediaTypeInts.joinToString(",")})")
  } else {
    selectionBuilder.append("${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}")
  }

  input["createdAfter"].takeIfInstanceOf<Number>()?.let {
    selectionBuilder.append(" AND ${MediaStore.Images.Media.DATE_TAKEN} > ${it.toLong()}")
  }
  input["createdBefore"].takeIfInstanceOf<Number>()?.let {
    selectionBuilder.append(" AND ${MediaStore.Images.Media.DATE_TAKEN} < ${it.toLong()}")
  }

  return selectionBuilder.toString()
}

/**
 * Converts media type string to value defined in [MediaLibraryConstants.MEDIA_TYPES]
 * @throws IllegalArgumentException if the value is not defined there
 */
@Throws(IllegalArgumentException::class)
private fun parseMediaType(mediaType: String): Int {
  return MediaLibraryConstants.MEDIA_TYPES.getOrElse(mediaType) {
    val errorMessage = "MediaType $mediaType is not supported!"
    throw IllegalArgumentException(errorMessage)
  }
}

/**
 * Converts sorting key string to value defined in [MediaLibraryConstants.SORT_KEYS]
 * @throws IllegalArgumentException if the value is not defined there
 */
@Throws(IllegalArgumentException::class)
fun parseSortByKey(key: String): String {
  return MediaLibraryConstants.SORT_KEYS.getOrElse(key) {
    val errorMessage = "SortBy key $key is not supported!"
    throw IllegalArgumentException(errorMessage)
  }
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
fun convertOrderDescriptors(orderDescriptor: List<*>): String {
  val results = ArrayList<String>(20)
  for (item in orderDescriptor) {
    when (item) {
      is String -> {
        val key = parseSortByKey(item)
        results.add("$key DESC")
      }
      is List<*> -> {
        require(item.size == 2) { "Array sortBy in assetsOptions has invalid layout." }
        val key = parseSortByKey(item[0] as String)
        val order = item[1] as Boolean
        results.add(key + if (order) " ASC" else " DESC")
      }
      else -> throw IllegalArgumentException("Array sortBy in assetsOptions contains invalid items.")
    }
  }
  return results.joinToString(separator = ",")
}
