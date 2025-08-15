package expo.modules.medialibrary.next.objects

import android.content.Context
import expo.modules.kotlin.exception.Exceptions.ReactContextLost
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.next.exceptions.AssetNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumAssetsIds
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumName
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumRelativePath

class Album(val id: Long, val context: Context) : SharedObject() {
  private val contentResolver
    get() = context.contentResolver ?: throw ReactContextLost()

  val name: String by lazy {
    contentResolver.queryAlbumName(id)
      ?: throw AssetNotFoundException("Album with ID=$id does not exist in MediaStore")
  }

  val relativePath: String by lazy {
    contentResolver.queryAlbumRelativePath(id)
      ?: throw AssetNotFoundException("Album with ID=$id does not exist in MediaStore")
  }

  // TODO: Return cached value, refresh cache on ContentObserver event
  val assets: List<Asset>
    get() = contentResolver
      .queryAlbumAssetsIds(id)
      .map { id -> Asset(id, context) }

  fun delete() {
    assets.forEach { asset -> asset.delete() }
  }

  fun add(asset: Asset) {
    asset.move(relativePath)
  }
}
