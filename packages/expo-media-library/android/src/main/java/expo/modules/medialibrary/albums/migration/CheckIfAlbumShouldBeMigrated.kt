package expo.modules.medialibrary.albums.migration

import android.content.Context
import android.os.AsyncTask
import android.os.Build
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.core.Promise
import expo.modules.medialibrary.ERROR_NO_ALBUM
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import java.io.File

@RequiresApi(Build.VERSION_CODES.R)
class CheckIfAlbumShouldBeMigrated(
  private val context: Context,
  private val albumId: String,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  public override fun doInBackground(vararg voids: Void?): Void? {
    val albumDir = getAlbumDirectory(context, albumId)
    if (albumDir == null) {
      promise.reject(ERROR_NO_ALBUM, "Couldn't find album")
    } else {
      promise.resolve(!albumDir.canWrite())
    }
    return null
  }
}

/**
 * Returns directory for given Album ID (`BUCKET_ID` column) or `null` if album not found.
 */
private fun getAlbumDirectory(context: Context, albumId: String): File? {
  val selection =
    "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}" +
      " AND ${MediaStore.MediaColumns.BUCKET_ID}=?"
  val selectionArgs = arrayOf(albumId)
  val projection = arrayOf(MediaStore.MediaColumns.DATA)
  context.contentResolver.query(
    EXTERNAL_CONTENT_URI,
    projection,
    selection,
    selectionArgs,
    null
  ).use { albumCursor ->
    if (albumCursor != null && albumCursor.moveToNext()) {
      val dataColumnIndex = albumCursor.getColumnIndex(MediaStore.Images.Media.DATA)
      val fileInAlbum = File(albumCursor.getString(dataColumnIndex))
      if (fileInAlbum.isFile) {
        return File(fileInAlbum.parent ?: return null)
      }
    }
  }
  return null
}
