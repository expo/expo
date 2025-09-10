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
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import java.io.File
import java.lang.ref.WeakReference

class Album(val id: String, context: Context) : SharedObject() {
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

  suspend fun getAssets(): List<Asset> {
    return contentResolver
      .queryAlbumAssetsContentUris(id)
      .map { contentUri -> Asset(contentUri, contextRef.getOrThrow()) }
  }

  suspend fun delete() = coroutineScope {
    getAssets().map { asset ->
      async {
        asset.delete()
      }
    }.awaitAll()
  }

  suspend fun add(asset: Asset) {
    asset.move(getRelativePath())
  }
}
