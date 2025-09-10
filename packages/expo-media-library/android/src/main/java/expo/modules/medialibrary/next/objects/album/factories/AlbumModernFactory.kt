package expo.modules.medialibrary.next.objects.album.factories

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.next.exceptions.AlbumCouldNotBeCreated
import expo.modules.medialibrary.next.exceptions.AlbumNotFoundException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumId
import expo.modules.medialibrary.next.objects.album.Album
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import expo.modules.medialibrary.next.objects.asset.factories.AssetFactory
import java.io.IOException
import java.lang.ref.WeakReference

@RequiresApi(Build.VERSION_CODES.Q)
class AlbumModernFactory(private val assetFactory: AssetFactory, context: Context) : AlbumFactory {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw AlbumCouldNotBeCreated("Failed to create album: ContentResolver is unavailable.")

  override suspend fun createFromAssets(albumName: String, assets: List<Asset>, deleteOriginalAssets: Boolean): Album =
    try {
      val mimeTypeOfFirstAsset = assets[0].getMimeType()
      val albumRelativePath = RelativePath.create(mimeTypeOfFirstAsset, albumName)
      processAssetsLocation(assets, albumRelativePath, deleteOriginalAssets)
      val albumId = contentResolver.queryAlbumId(albumRelativePath)
        ?: throw AlbumNotFoundException("Could not find album with relativePath: $albumRelativePath")
      Album(albumId, contextRef.getOrThrow())
    } catch (e: SecurityException) {
      throw AlbumCouldNotBeCreated("Security Exception: ${e.message}", e)
    } catch (e: IOException) {
      throw AlbumCouldNotBeCreated("I/O error while creating album: ${e.message}", e)
    }

  override suspend fun createFromFilePaths(albumName: String, filePaths: List<Uri>): Album {
    val mimeType = MimeType.from(filePaths[0])
    val relativePath = RelativePath.create(mimeType, albumName)
    filePaths.forEach { filePath ->
      assetFactory.create(filePath, relativePath)
    }
    val albumId = contentResolver.queryAlbumId(relativePath)
      ?: throw AlbumCouldNotBeCreated("Failed to create album: newly created album was not found in the MediaStore.")
    return Album(albumId, contextRef.getOrThrow())
  }

  private suspend fun processAssetsLocation(assets: List<Asset>, relativePath: RelativePath, deleteOriginalAssets: Boolean) {
    if (deleteOriginalAssets) {
      assets.map { it.move(relativePath) }
    } else {
      assets.map { it.copy(relativePath) }
    }
  }
}
