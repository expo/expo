package expo.modules.medialibrary

import android.content.Context
import android.database.Cursor.FIELD_TYPE_NULL
import android.os.AsyncTask
import android.os.Bundle
import android.provider.MediaStore
import android.provider.MediaStore.Images.Media
import org.unimodules.core.Promise

internal open class GetAlbums(private val mContext: Context, private val mPromise: Promise)
  : AsyncTask<Void?, Void?, Void?>() {

  override fun doInBackground(vararg params: Void?): Void? {
    val projection = arrayOf(Media.BUCKET_ID, Media.BUCKET_DISPLAY_NAME)
    val selection = "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}"

    val albums = HashMap<String, Album>()

    try {
      mContext.contentResolver
        .query(
          MediaLibraryConstants.EXTERNAL_CONTENT,
          projection,
          selection,
          null,
          Media.BUCKET_DISPLAY_NAME)
        .use { asset ->
          if (asset == null) {
            mPromise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD,
              "Could not get albums. Query returns null.")
            return@use
          }
          val bucketIdIndex = asset.getColumnIndex(Media.BUCKET_ID)
          val bucketDisplayNameIndex = asset.getColumnIndex(Media.BUCKET_DISPLAY_NAME)

          while (asset.moveToNext()) {
            val id = asset.getString(bucketIdIndex)

            if (asset.getType(bucketDisplayNameIndex) == FIELD_TYPE_NULL) {
              continue
            }

            val album = albums[id] ?: Album(
                id = id,
                title = asset.getString(bucketDisplayNameIndex)
              ).also {
                albums[id] = it
              }

            album.count++
          }

          mPromise.resolve(albums.values.map { it.toBundle() })
        }
    } catch (e: SecurityException) {
      mPromise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get albums: need READ_EXTERNAL_STORAGE permission.", e)
    } catch (e: RuntimeException) {
      mPromise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD, "Could not get albums.", e)
    }
    return null
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
