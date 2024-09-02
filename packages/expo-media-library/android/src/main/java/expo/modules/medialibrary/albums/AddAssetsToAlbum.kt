package expo.modules.medialibrary.albums

import android.content.Context
import android.media.MediaScannerConnection
import android.os.Build
import android.provider.MediaStore
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.MediaLibraryException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.PermissionsException
import java.io.File
import java.util.concurrent.atomic.AtomicInteger

internal class AddAssetsToAlbum(
  private val context: Context,
  private val assetIds: Array<String>,
  private val albumId: String,
  copyToAlbum: Boolean,
  private val promise: Promise
) {
  private val strategy = if (copyToAlbum) AssetFileStrategy.copyStrategy else AssetFileStrategy.moveStrategy

  // Media store table can be corrupted. Extra check won't harm anyone.
  private val album: File
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
          throw AlbumException("Could not get album. Query returns null.")
        } else if (albumCursor.count == 0) {
          throw AlbumException("No album with id: $albumId")
        }
        albumCursor.moveToNext()
        val filePathColumnIndex = albumCursor.getColumnIndex(MediaStore.Images.Media.DATA)
        val fileInAlbum = File(albumCursor.getString(filePathColumnIndex))

        // Media store table can be corrupted. Extra check won't harm anyone.
        if (!fileInAlbum.isFile && !fileInAlbum.isDirectory) {
          throw MediaLibraryException()
        }
        return File(fileInAlbum.parent!!)
      }
    }

  fun execute() {
    val assets = MediaLibraryUtils.getAssetsById(context, *assetIds)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !album.canWrite()) {
      throw PermissionsException(
        "The application doesn't have permission to write to the album's directory. For more information, check out https://expo.fyi/android-r."
      )
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
  }
}
