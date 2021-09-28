package expo.modules.medialibrary

import android.provider.MediaStore
import java.lang.IllegalArgumentException

data class GetAssetsQuery(
    val selection: String,
    val order: String,
    val limit: Int,
    val offset: Int,
)

@Throws(IllegalArgumentException::class)
internal fun getQueryFromAssetOptions(input: Map<String, Any?>): GetAssetsQuery {
  val limit = input["first"].takeIfInstanceOf<Number>()?.toInt() ?: 20

  // to maintain compatibility with iOS field `after` is string
  val offset = input["after"].takeIfInstanceOf<String>()
        ?.runCatching { toInt() }   // NumberFormatException
        ?.getOrNull()
        ?: 0

  val selection = createSelectionString(input)

  val sortBy = input["sortBy"].takeIfInstanceOf<List<*>>()
  val order = if (sortBy != null && sortBy.isNotEmpty()) {
    MediaLibraryUtils.mapOrderDescriptor(sortBy)
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

    val mediaTypeInts = mediaType.map { convertMediaType(it.toString()) }
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

@Throws(IllegalArgumentException::class)
private fun convertMediaType(mediaType: String): Int {
  return MediaLibraryConstants.MEDIA_TYPES.getOrElse(mediaType) {
    val errorMessage = "MediaType $mediaType is not supported!"
    throw IllegalArgumentException(errorMessage)
  }
}
