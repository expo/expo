package expo.modules.medialibrary.next.objects.album.factories

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import expo.modules.core.utilities.ifNull
import expo.modules.medialibrary.next.exceptions.AlbumCouldNotBeCreated
import expo.modules.medialibrary.next.exceptions.AlbumNotFoundException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.queryAssetBucketId
import expo.modules.medialibrary.next.objects.album.Album
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import expo.modules.medialibrary.next.objects.asset.factories.AssetFactory
import java.io.File
import java.io.IOException
import java.lang.ref.WeakReference

@DeprecatedSinceApi(Build.VERSION_CODES.Q)
class AlbumLegacyFactory(private val assetFactory: AssetFactory, context: Context) : AlbumFactory {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw AlbumCouldNotBeCreated("Failed to create album: ContentResolver is unavailable.")

  override suspend fun createFromAssets(albumName: String, assets: List<Asset>, deleteOriginalAssets: Boolean): Album {
    try {
      val firstAsset = assets.firstOrNull()
        ?: throw AlbumCouldNotBeCreated("No assets provided")
      val mimeTypeOfFirstAsset = firstAsset.getMimeType()
      val relativePath = RelativePath.create(mimeTypeOfFirstAsset, albumName)
      createAlbumDirectoryIfNotExists(relativePath)
      processAssetsLocation(assets, relativePath, true)
      val albumId = contentResolver.queryAssetBucketId(assets[0].contentUri)
        ?: throw AlbumNotFoundException("Could not find album with filePath: ${relativePath.toFilePath()}")
      return Album(albumId.toString(), contextRef.getOrThrow())
    } catch (e: SecurityException) {
      throw AlbumCouldNotBeCreated("Missing WRITE_EXTERNAL_STORAGE permission: ${e.message}", e)
    } catch (e: IOException) {
      throw AlbumCouldNotBeCreated("IO error while creating album: ${e.message}", e)
    }
  }

  override suspend fun createFromFilePaths(albumName: String, filePaths: List<Uri>): Album {
    val firstFilePath = filePaths.firstOrNull()
      ?: throw AlbumCouldNotBeCreated("No file paths provided")
    val mimeTypeOfFirstFile = MimeType.from(firstFilePath)
    val relativePath = RelativePath.create(mimeTypeOfFirstFile, albumName)
    val assets = filePaths.map { filePath ->
      assetFactory.create(filePath, relativePath)
    }
    val albumId = contentResolver.queryAssetBucketId(assets[0].contentUri)
      ?: throw AlbumCouldNotBeCreated("Could not find album with relativePath: $relativePath")
    return Album(albumId.toString(), contextRef.getOrThrow())
  }

  private suspend fun processAssetsLocation(assets: List<Asset>, relativePath: RelativePath, deleteOriginalAssets: Boolean) {
    if (deleteOriginalAssets) {
      assets.map { it.move(relativePath) }
    } else {
      assets.map { it.copy(relativePath) }
    }
  }

  private fun createAlbumDirectoryIfNotExists(relativePath: RelativePath) {
    File(relativePath.toFilePath())
      .takeIf { it.exists() || it.mkdirs() }
      .ifNull {
        throw AlbumCouldNotBeCreated("Could not create album directory")
      }
  }
}
