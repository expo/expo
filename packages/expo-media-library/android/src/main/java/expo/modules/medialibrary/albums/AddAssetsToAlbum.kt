package expo.modules.medialibrary.albums

import android.content.Context
import android.os.AsyncTask
import android.provider.MediaStore
import android.media.MediaScannerConnection
import android.os.Build
import expo.modules.core.Promise
import expo.modules.medialibrary.ERROR_IO_EXCEPTION
import expo.modules.medialibrary.ERROR_MEDIA_LIBRARY_CORRUPTED
import expo.modules.medialibrary.ERROR_NO_ALBUM
import expo.modules.medialibrary.ERROR_NO_PERMISSIONS
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_SAVE_PERMISSION
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.MediaLibraryUtils
import java.io.File
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger

internal class AddAssetsToAlbum(
  private val context: Context,
  private val assetIds: Array<String>,
  private val albumId: String,
  copyToAlbum: Boolean,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  private val strategy = if (copyToAlbum) AssetFileStrategy.copyStrategy else AssetFileStrategy.moveStrategy

  // Media store table can be corrupted. Extra check won't harm anyone.
  private val album: File?
    get() {
      val path = arrayOf(MediaStore.MediaColumns.DATA)
      val selection = "${MediaStore.MediaColumns.BUCKET_ID}=?"
      val id = arrayOf(albumId)
      context.contentResolver.query(
        EXTERNAL_CONTENT_URI,
        path,
        selection,
        id,
        null
      ).use { albumCursor ->
        if (albumCursor == null) {
          promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get album. Query returns null.")
          return null
        } else if (albumCursor.count == 0) {
          promise.reject(ERROR_NO_ALBUM, "No album with id: $albumId")
          return null
        }
        albumCursor.moveToNext()
        val filePathColumnIndex = albumCursor.getColumnIndex(MediaStore.Images.Media.DATA)
        val fileInAlbum = File(albumCursor.getString(filePathColumnIndex))

        // Media store table can be corrupted. Extra check won't harm anyone.
        if (!fileInAlbum.isFile) {
          promise.reject(ERROR_MEDIA_LIBRARY_CORRUPTED, "Media library is corrupted")
          return null
        }
        return File(fileInAlbum.parent!!)
      }
    }

  public override fun doInBackground(vararg params: Void?): Void? {
    try {
      val assets = MediaLibraryUtils.getAssetsById(context, promise, *assetIds) ?: return null
      val album = album ?: return null

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !album.canWrite()) {
        promise.reject(
          ERROR_NO_PERMISSIONS,
          "The application doesn't have permission to write to the album's directory. For more information, check out https://expo.fyi/android-r."
        )
        return null
      }

      val paths = assets.map { asset ->
        val newAsset = strategy.apply(asset, album, context)
        newAsset.path
      }

      val atomicInteger = AtomicInteger(paths.size)
      MediaScannerConnection.scanFile(context, paths.toTypedArray(), null) { _, _ ->
        if (atomicInteger.decrementAndGet() == 0) {
          promise.resolve(true)
        }
      }
    } catch (e: SecurityException) {
      promise.reject(ERROR_UNABLE_TO_SAVE_PERMISSION, "Could not get albums: need WRITE_EXTERNAL_STORAGE permission.", e)
    } catch (e: IOException) {
      promise.reject(ERROR_IO_EXCEPTION, "Unable to read or save data", e)
    }
    return null
  }
}
