package expo.modules.medialibrary.next.objects

import android.content.ContentUris
import android.content.Context
import android.os.Build
import expo.modules.kotlin.exception.Exceptions.ReactContextLost
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.next.extensions.resolver.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.publishPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetLocalUri
import java.io.File

open class Asset(val id: Long, val context: Context) : SharedObject() {
  private val contentResolver by lazy {
    context.contentResolver ?: throw ReactContextLost()
  }
  val contentUri = ContentUris.withAppendedId(EXTERNAL_CONTENT_URI, id)

  fun getLocalUri(): String {
    return contentResolver.queryAssetLocalUri(contentUri)
  }

  fun getDisplayName(): String {
    return contentResolver.queryAssetDisplayName(contentUri) ?: throw Exception("TODO")
  }

  fun getMimeType(): String? {
    return contentResolver.getType(contentUri)
  }

  // `Copy` and `move` returns a new asset, instead of modifying, to keep Asset immutable
  fun copy(targetRelativePath: String): Asset {
    val newAssetUri = contentResolver.insertPendingAsset(getDisplayName(), getMimeType(), targetRelativePath)
    contentResolver.copyUriContent(contentUri, newAssetUri)
    contentResolver.publishPendingAsset(newAssetUri)
    return Asset(ContentUris.parseId(newAssetUri), context)
  }

  fun move(targetRelativePath: String): Asset {
    val asset = copy(targetRelativePath)
    delete()
    return asset
  }

  fun delete() {
    // Android versions 29 and earlier requires to manually remove a file
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      if (!File(getLocalUri()).delete()) {
        throw AssetFileException("Could not delete file.")
      }
    }
    contentResolver.delete(contentUri, null, null)
  }
}
