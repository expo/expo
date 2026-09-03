package expo.modules.ui.graphics

import android.content.Context
import android.net.Uri
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class ImageSource(
  @Field val uri: String,
  @Field val width: Int = 0,
  @Field val height: Int = 0,
  @Field val scale: Double = 1.0
) : Record

internal fun ImageSource.resolveUri(context: Context): String? {
  return try {
    val parsedUri = Uri.parse(uri)
    if (parsedUri.scheme == null) {
      ResourceIdHelper.getResourceUri(context, uri)?.toString()
    } else {
      uri
    }
  } catch (_: Exception) {
    ResourceIdHelper.getResourceUri(context, uri)?.toString()
  }
}
