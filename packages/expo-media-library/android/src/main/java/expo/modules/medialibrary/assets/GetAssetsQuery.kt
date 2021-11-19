package expo.modules.medialibrary.assets

import android.provider.MediaStore
import expo.modules.core.utilities.ifNull
import expo.modules.core.utilities.takeIfInstanceOf
import expo.modules.medialibrary.GET_ASSETS_DEFAULT_LIMIT
import expo.modules.medialibrary.MediaType
import expo.modules.medialibrary.SortBy
import java.util.ArrayList

data class GetAssetsQuery(
  val selection: String,
  val order: String,
  val limit: Int,
  val offset: Int,
)

@Throws(IllegalArgumentException::class)
internal fun getQueryFromOptions(input: Map<String, Any?>): GetAssetsQuery {
  val limit = input["first"].takeIfInstanceOf<Number>()?.toInt() ?: GET_ASSETS_DEFAULT_LIMIT

  // to maintain compatibility with iOS field `after` is string
  val offset = input["after"]
    .takeIfInstanceOf<String>()
    ?.runCatching { toInt() } // NumberFormatException
    ?.getOrNull()
    ?: 0

  val selection = createSelectionString(input)

  val sortBy = input["sortBy"] as? List<*>
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

  val mediaType = input["mediaType"] as? List<*>
  if (mediaType != null && !mediaType.contains(MediaType.ALL.apiName)) {
    val mediaTypeInts = mediaType.map { parseMediaType(it.toString()) }
    selectionBuilder.append(
      "${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (${mediaTypeInts.joinToString(separator = ",")})"
    )
  } else {
    selectionBuilder.append(
      "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}"
    )
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
