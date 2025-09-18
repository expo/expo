package expo.modules.medialibrary.next.objects.album

import android.content.Context
import android.os.Build
import android.os.Environment
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.next.exceptions.AlbumPropertyNotFoundException
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumAssetsContentUris
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumFilepath
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumRelativePath
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumTitle
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.asset.deleters.AssetDeleter
import expo.modules.medialibrary.next.objects.asset.factories.AssetFactory
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import java.io.File
import java.lang.ref.WeakReference

class Album(
  val id: String,
  val assetDeleter: AssetDeleter,
  val assetFactory: AssetFactory,
  context: Context
): SharedObject() {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  suspend fun getTitle(): String {
    return contentResolver.queryAlbumTitle(id)
      ?: throw AlbumPropertyNotFoundException("Album with ID=$id does not exist in MediaStore")
  }

  suspend fun getRelativePath(): RelativePath {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      contentResolver.queryAlbumRelativePath(id)
        ?: throw AlbumPropertyNotFoundException("Album with ID=$id does not exist in MediaStore")
    } else {
      val filePath = contentResolver.queryAlbumFilepath(id)
        ?: throw AlbumPropertyNotFoundException("Album with ID=$id does not exist in MediaStore")
      createRelativePathFrom(filePath)
    }
  }

  private fun createRelativePathFrom(filePath: String): RelativePath {
    val albumDir = File(filePath).parent
      ?: throw AlbumPropertyNotFoundException("Could get a relative path for the album")
    val externalRoot = Environment.getExternalStorageDirectory().absolutePath
    val relative = albumDir.removePrefix(externalRoot).trimStart('/').plus('/')
    return RelativePath(relative)
  }

  suspend fun getAssets(): List<Asset> =
    contentResolver
      .queryAlbumAssetsContentUris(id)
      .map { assetFactory.create(it) }

  suspend fun delete() =
    assetDeleter.delete(
      getAssets().map { it.contentUri }
    )

  suspend fun add(asset: Asset) =
    asset.move(getRelativePath())
}
