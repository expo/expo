package expo.modules.medialibrary.albums

import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.assets.CreateAssetWithAlbumFile
import kotlinx.coroutines.CompletableDeferred
import java.io.File
import java.io.IOException

internal class CreateAlbum(
  private val context: Context,
  private val albumName: String,
  private val assetId: String,
  copyAsset: Boolean
) {
  private val mStrategy = if (copyAsset) AssetFileStrategy.copyStrategy else AssetFileStrategy.moveStrategy
  suspend fun execute(): Bundle? {
    try {
      val files = MediaLibraryUtils.getAssetsById(context, assetId)
      val albumCreator = files[0]
      val album = createAlbumFile(albumCreator.mimeType, albumName)
      val newFile = mStrategy.apply(albumCreator, album, context)

      val result = CompletableDeferred<Bundle?>()

      MediaScannerConnection.scanFile(
        context,
        arrayOf(newFile.path),
        null
      ) { path: String, uri: Uri? ->
        if (uri == null) {
          result.completeExceptionally(
            AlbumException("Could not add image to album.")
          )
          return@scanFile
        }

        val selection = "${MediaStore.Images.Media.DATA}=?"
        val args = arrayOf(path)
        val bundle = queryAlbum(context, selection, args)
        result.complete(bundle)
      }

      return result.await()
    } catch (e: SecurityException) {
      throw UnableToLoadException("Could not create album: need WRITE_EXTERNAL_STORAGE permission $e")
    } catch (e: IOException) {
      throw UnableToLoadException("Could not read file or parse EXIF tags $e")
    }
  }
}

// Creates the album file and uses existing CreateAssetWithAlbumFile to create the asset inside the album.
internal class CreateAlbumWithInitialFileUri(val context: Context, val albumName: String, val assetUri: Uri) {
  suspend fun execute(): Bundle? {
    val mimeType: String = MediaLibraryUtils.getMimeType(context.contentResolver, assetUri) ?: run {
      throw AlbumException("Failed to create album: could not determine MIME type of the asset with uri: `$assetUri`.")
    }
    val assetUriPath = assetUri.path ?: run {
      throw AlbumException("Failed to create album: could not determine path of the asset with uri: `$assetUri`.")
    }

    val albumFile: File = createAlbumFile(mimeType, albumName)
    val mediaFile: File = File(assetUriPath)

    if (!mediaFile.exists()) {
      throw AlbumException("Failed to create album: the local media file with uri: `$assetUri` does not exist.")
    }

    CreateAssetWithAlbumFile(context, assetUri.toString(), false, albumFile).execute()
    return GetAlbum(context, albumName).execute()
  }
}
