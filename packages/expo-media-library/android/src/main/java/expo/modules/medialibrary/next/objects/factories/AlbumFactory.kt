package expo.modules.medialibrary.next.objects.factories

import android.content.Context
import android.media.MediaScannerConnection
import android.os.Environment
import android.webkit.MimeTypeMap
import expo.modules.kotlin.exception.Exceptions.ReactContextLost
import expo.modules.medialibrary.UnableToLoadException
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumId
import expo.modules.medialibrary.next.objects.Album
import expo.modules.medialibrary.next.objects.Asset
import java.io.IOException

class AlbumFactory(private val context: Context) {
  private val contentResolver get() = context.contentResolver ?: throw ReactContextLost()

  suspend fun createFromAssets(
    name: String,
    assets: List<Asset>,
    move: Boolean
  ): Album {
    try {
      val mimeTypeOfFirstAsset = assets[0].getMimeType()
      val relativePath = buildRelativePath(mimeTypeOfFirstAsset, name)
      processAssetsLocation(assets, relativePath, move)
      refreshMediaStoreVisibility(assets)
      val albumId = contentResolver.queryAlbumId(relativePath)
        ?: throw IOException("Could not find album with relativePath: $relativePath")
      return Album(albumId, context)
    } catch (e: SecurityException) {
      throw UnableToLoadException("Missing WRITE_EXTERNAL_STORAGE permission: ${e.message}", e)
    } catch (e: IOException) {
      throw UnableToLoadException("I/O error while creating album: ${e.message}", e)
    }
  }

  fun createFromFilePaths(name: String, filePaths: List<String>, assetFactory: AssetFactory): Album {
    val mimeType = getMimeTypeFromFileUrl(filePaths[0])
    val relativePath = buildRelativePath(mimeType, name)
    filePaths.forEach { filePath ->
      assetFactory.create(filePath, relativePath)
    }
    val albumId = contentResolver.queryAlbumId(relativePath)
      ?: throw IOException("Could not find album with relativePath: $relativePath")
    return Album(albumId, context)
  }

  private fun getMimeTypeFromFileUrl(url: String): String? {
    val extension = MimeTypeMap.getFileExtensionFromUrl(url) ?: return null
    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
  }

  private fun buildRelativePath(mimeType: String?, albumName: String): String {
    val rootDirectory = getRootDirectoryForAssetType(mimeType, false)
    return "$rootDirectory/$albumName/"
  }

  private fun getRootDirectoryForAssetType(mimeType: String?, useCameraDir: Boolean): String {
    if (mimeType?.contains("image") == true || mimeType?.contains("video") == true) {
      return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
    } else if (mimeType?.contains("audio") == true) {
      return Environment.DIRECTORY_MUSIC
    }
    // For backward compatibility
    return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
  }

  private suspend fun processAssetsLocation(
    assets: List<Asset>,
    targetRelativePath: String,
    move: Boolean
  ) = when (move) {
    true -> assets.map { it.move(targetRelativePath) }
    false -> assets.map { it.move(targetRelativePath) }
  }

  private fun refreshMediaStoreVisibility(assets: List<Asset>) {
    val uris = assets.map { it.contentUri.toString() }.toTypedArray()
    MediaScannerConnection.scanFile(context, uris, null) { _, _ -> /* no-op callback */ }
  }
}
