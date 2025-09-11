package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentUris
import android.database.Cursor
import android.net.Uri
import android.provider.MediaStore

fun Cursor.extractAssetContentUri(idColumn: Int, typeColumn: Int): Uri {
  val id = getLong(idColumn)
  val mediaType = getInt(typeColumn)
  val baseUri = when (mediaType) {
    MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
    MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    else -> EXTERNAL_CONTENT_URI
  }
  return ContentUris.withAppendedId(baseUri, id)
}
