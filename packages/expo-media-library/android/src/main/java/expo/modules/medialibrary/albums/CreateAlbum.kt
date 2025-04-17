package expo.modules.medialibrary.albums

import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.provider.MediaStore
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.assets.CreateAssetWithAlbumFile
import java.io.File
import java.io.IOException

internal class CreateAlbum(
  private val context: Context,
  private val albumName: String,
  private val assetId: String,
  copyAsset: Boolean,
  private val promise: Promise
) {
  private val mStrategy = if (copyAsset) AssetFileStrategy.copyStrategy else AssetFileStrategy.moveStrategy

  fun execute() {
    try {
      val files = MediaLibraryUtils.getAssetsById(context, assetId)
      val albumCreator = files[0]
      val album = createAlbumFile(albumCreator.mimeType, albumName)
      val newFile = mStrategy.apply(albumCreator, album, context)
      MediaScannerConnection.scanFile(
        context,
        arrayOf(newFile.path),
        null
      ) { path: String, uri: Uri? ->
        if (uri == null) {
          throw AlbumException("Could not add image to album.")
        }
        val selection = "${MediaStore.Images.Media.DATA}=?"
        val args = arrayOf(path)
        queryAlbum(context, selection, args, promise)
      }
    } catch (e: SecurityException) {
      promise.reject(
        ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not create album: need WRITE_EXTERNAL_STORAGE permission.",
        e
      )
    } catch (e: IOException) {
      promise.reject(ERROR_UNABLE_TO_LOAD, "Could not read file or parse EXIF tags", e)
    }
  }
}

// Creates the album file and uses existing CreateAssetWithAlbumFile to create the asset inside the album.
internal class CreateAlbumWithInitialFileUri(val context: Context, val albumName: String, val assetUri: Uri, val promise: Promise) {
  fun execute() {
    val mimeType: String = MediaLibraryUtils.getMimeType(context.contentResolver, assetUri) ?: run {
      promise.reject(AlbumException("Failed to create album: could not determine MIME type of the asset with uri: `$assetUri`."))
      return
    }
    val assetUriPath = assetUri.path ?: run {
      promise.reject(AlbumException("Failed to create album: could not determine path of the asset with uri: `$assetUri`."))
      return
    }

    val albumFile: File = createAlbumFile(mimeType, albumName)
    val mediaFile: File = File(assetUriPath)

    if (!mediaFile.exists()) {
      promise.reject(AlbumException("Failed to create album: the local media file with uri: `$assetUri` does not exist."))
      return
    }

    val createAssetPromise = object : Promise {
      override fun resolve(value: Any?) {
        // Resolve our promise with the newly created album
        GetAlbum(context, albumName, promise).execute()
      }

      override fun reject(code: String, message: String?, cause: Throwable?) {
        promise.reject(code, "Failed to create the album: $message", cause)
      }
    }

    CreateAssetWithAlbumFile(context, assetUri.toString(), createAssetPromise, false, albumFile).execute()
  }
}
