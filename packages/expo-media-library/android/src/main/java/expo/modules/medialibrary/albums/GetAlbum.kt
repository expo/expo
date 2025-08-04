package expo.modules.medialibrary.albums

import android.content.Context
import android.os.Bundle
import android.provider.MediaStore.Files.FileColumns
import android.provider.MediaStore.MediaColumns

suspend fun getAlbum(context: Context, albumName: String): Bundle? {
  val selection = "${FileColumns.MEDIA_TYPE} != ${FileColumns.MEDIA_TYPE_NONE}" +
    " AND ${MediaColumns.BUCKET_DISPLAY_NAME}=?"
  val selectionArgs = arrayOf(albumName)

  return queryAlbum(context, selection, selectionArgs)
}
