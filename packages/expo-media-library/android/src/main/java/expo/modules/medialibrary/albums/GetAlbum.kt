package expo.modules.medialibrary.albums

import android.content.Context
import android.provider.MediaStore.Files.FileColumns
import android.provider.MediaStore.MediaColumns
import expo.modules.kotlin.Promise

internal class GetAlbum(
  private val context: Context,
  private val albumName: String,
  private val promise: Promise
) {
  fun execute() {
    val selection = "${FileColumns.MEDIA_TYPE} != ${FileColumns.MEDIA_TYPE_NONE}" +
      " AND ${MediaColumns.BUCKET_DISPLAY_NAME}=?"
    val selectionArgs = arrayOf(albumName)

    queryAlbum(context, selection, selectionArgs, promise)
  }
}
