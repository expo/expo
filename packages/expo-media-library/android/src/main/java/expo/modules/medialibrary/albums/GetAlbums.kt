package expo.modules.medialibrary.albums

import android.content.Context
import android.database.Cursor.FIELD_TYPE_NULL
import android.os.Bundle
import android.provider.MediaStore
import android.provider.MediaStore.Images.Media
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.UnableToLoadException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

suspend fun getAlbums(context: Context): List<Bundle> = withContext(Dispatchers.IO) {
  val projection = arrayOf(Media.BUCKET_ID, Media.BUCKET_DISPLAY_NAME)
  val selection = "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}"

  val albums = HashMap<String, Album>()

  try {
    context.contentResolver
      .query(
        EXTERNAL_CONTENT_URI,
        projection,
        selection,
        null,
        Media.BUCKET_DISPLAY_NAME
      )
      .use { assetCursor ->
        coroutineContext.ensureActive()
        if (assetCursor == null) {
          throw AlbumException("Could not get albums. Query returns null")
        }
        val bucketIdIndex = assetCursor.getColumnIndex(Media.BUCKET_ID)
        val bucketDisplayNameIndex = assetCursor.getColumnIndex(Media.BUCKET_DISPLAY_NAME)

        while (assetCursor.moveToNext()) {
          // When getting albums, coroutine should immediately close after detecting that
          // scope is inactive – it is a GET operation, thus requires no atomicity of operations.
          coroutineContext.ensureActive()
          val id = assetCursor.getString(bucketIdIndex)

          if (assetCursor.getType(bucketDisplayNameIndex) == FIELD_TYPE_NULL) {
            continue
          }

          val album = albums[id] ?: Album(
            id = id,
            title = assetCursor.getString(bucketDisplayNameIndex)
          ).also {
            albums[id] = it
          }

          album.count++
        }
        return@withContext albums.values.map { it.toBundle() }
      }
  } catch (e: SecurityException) {
    throw UnableToLoadException("Could not get albums: need READ_EXTERNAL_STORAGE permission ${e.message}", e)
  } catch (e: RuntimeException) {
    throw UnableToLoadException("Could not get albums ${e.message}", e)
  }
}

private class Album(private val id: String, private val title: String, var count: Int = 0) {
  fun toBundle() = Bundle().apply {
    putString("id", id)
    putString("title", title)
    putParcelable("type", null)
    putInt("assetCount", count)
  }
}
