package expo.modules.medialibrary.albums

import android.content.Context
import android.os.AsyncTask
import android.media.MediaScannerConnection
import android.net.Uri
import android.provider.MediaStore
import expo.modules.core.Promise
import expo.modules.core.utilities.ifNull
import expo.modules.medialibrary.ERROR_NO_ALBUM
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.ERROR_UNABLE_TO_SAVE
import expo.modules.medialibrary.MediaLibraryUtils
import java.io.File
import java.io.IOException

internal class CreateAlbum(
  private val context: Context,
  private val albumName: String,
  private val assetId: String,
  copyAsset: Boolean,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  private val mStrategy = if (copyAsset) AssetFileStrategy.copyStrategy else AssetFileStrategy.moveStrategy

  private fun createAlbum(mimeType: String): File? {
    val albumDir = MediaLibraryUtils.getEnvDirectoryForAssetType(mimeType, false)
      .ifNull {
        promise.reject(ERROR_NO_ALBUM, "Could not guess asset type.")
        return null
      }

    val album = File(albumDir.path, albumName)
      .takeIf { it.exists() || it.mkdirs() }
      .ifNull {
        promise.reject(ERROR_NO_ALBUM, "Could not create album directory.")
        return null
      }
    return album
  }

  public override fun doInBackground(vararg params: Void?): Void? {
    try {
      val files = MediaLibraryUtils.getAssetsById(context, promise, assetId) ?: return null
      val albumCreator = files[0]
      val album = createAlbum(albumCreator.mimeType) ?: return null
      val newFile = mStrategy.apply(albumCreator, album, context)
      MediaScannerConnection.scanFile(
        context,
        arrayOf(newFile.path),
        null
      ) { path: String, uri: Uri? ->
        if (uri == null) {
          promise.reject(ERROR_UNABLE_TO_SAVE, "Could not add image to album.")
          return@scanFile
        }
        val selection = "${MediaStore.Images.Media.DATA}=?"
        val args = arrayOf(path)
        queryAlbum(context, selection, args, promise)
      }
    } catch (e: SecurityException) {
      promise.reject(
        ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not create album: need WRITE_EXTERNAL_STORAGE permission.", e
      )
    } catch (e: IOException) {
      promise.reject(ERROR_UNABLE_TO_LOAD, "Could not read file or parse EXIF tags", e)
    }
    return null
  }
}
