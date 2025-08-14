package expo.modules.medialibrary.next.objects

import android.content.Context
import expo.modules.kotlin.exception.Exceptions.ReactContextLost
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.next.exceptions.AlbumPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumAssetsContentUris
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumRelativePath
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumTitle
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope

class Album(val id: Long, val context: Context) : SharedObject() {
  private val contentResolver
    get() = context.contentResolver ?: throw ReactContextLost()

  suspend fun getTitle(): String {
    return contentResolver.queryAlbumTitle(id)
      ?: throw AlbumPropertyNotFoundException("Album with ID=$id does not exist in MediaStore")
  }

  suspend fun getRelativePath(): String {
    return contentResolver.queryAlbumRelativePath(id)
      ?: throw AlbumPropertyNotFoundException("Album with ID=$id does not exist in MediaStore")
  }

  // TODO: Return cached value, refresh cache on ContentObserver event
  val assets: List<Asset>
    get() = contentResolver
      .queryAlbumAssetsContentUris(id)
      .map { contentUri -> Asset(contentUri, context) }

  suspend fun delete() = coroutineScope {
    assets.map { asset ->
      async {
        asset.delete()
      }
    }.awaitAll()
  }

  suspend fun add(asset: Asset) {
    asset.move(getRelativePath())
  }
}
