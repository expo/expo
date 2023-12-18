package expo.modules.medialibrary.albums

import android.content.Context
import android.database.Cursor.FIELD_TYPE_NULL
import android.os.Bundle
import android.provider.MediaStore
import android.provider.MediaStore.Images.Media
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI

internal open class GetAlbums(
  private val context: Context,
  private val promise: Promise
) {
  fun execute() {
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
          if (assetCursor == null) {
            throw AlbumException("Could not get albums. Query returns null")
          }
          val bucketIdIndex = assetCursor.getColumnIndex(Media.BUCKET_ID)
          val bucketDisplayNameIndex = assetCursor.getColumnIndex(Media.BUCKET_DISPLAY_NAME)

          while (assetCursor.moveToNext()) {
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

          promise.resolve(albums.values.map { it.toBundle() })
        }
    } catch (e: SecurityException) {
      promise.reject(
        ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get albums: need READ_EXTERNAL_STORAGE permission.",
        e
      )
    } catch (e: RuntimeException) {
      promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get albums.", e)
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
}
