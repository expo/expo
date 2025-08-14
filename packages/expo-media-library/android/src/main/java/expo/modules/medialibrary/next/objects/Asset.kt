package expo.modules.medialibrary.next.objects

import android.content.Context
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.exception.Exceptions.ReactContextLost
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDuration
import expo.modules.medialibrary.next.extensions.resolver.queryAssetHeight
import expo.modules.medialibrary.next.extensions.resolver.queryAssetModificationDate
import expo.modules.medialibrary.next.extensions.resolver.queryAssetUri
import expo.modules.medialibrary.next.extensions.resolver.queryAssetWidth
import expo.modules.medialibrary.next.extensions.resolver.queryGetCreationTime
import expo.modules.medialibrary.next.extensions.resolver.updateRelativePath
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

open class Asset(contentUri: Uri, val context: Context) : SharedObject() {
  // This property is mutable only to ensure backward compatibility with Android <29.
  // Once Android 29 support is dropped, this property should be made immutable.
  // In newer Android versions the contentResolver can update corresponding files in the
  // file system keeping the same contentUri, whereas on older versions it is required
  // to sometimes (e.g. in `move` function) delete the old file and insert a new entry to
  // the database resulting in creating a new contentUri.
  var contentUri: Uri = contentUri
    private set

  private val contentResolver by lazy {
    context.contentResolver ?: throw ReactContextLost()
  }

  suspend fun getCreationTime(): Long? =
    contentResolver.queryGetCreationTime(contentUri).takeIf { it != 0L }

  suspend fun getDuration(): Long? =
    contentResolver.queryAssetDuration(contentUri).takeIf { it != 0L }

  suspend fun getFilename(): String =
    contentResolver.queryAssetDisplayName(contentUri)
      ?: throw AssetPropertyNotFoundException("Filename")

  suspend fun getHeight(): Int =
    contentResolver.queryAssetHeight(contentUri)
      ?: throw AssetPropertyNotFoundException("Height")

  fun getMediaType(): String {
    return contentResolver.getType(contentUri)
      ?: throw AssetPropertyNotFoundException("MediaType")
  }

  suspend fun getModificationTime(): Long? =
    contentResolver.queryAssetModificationDate(contentUri).takeIf { it != 0L }

  suspend fun getUri(): String =
    contentResolver.queryAssetUri(contentUri)
      ?: throw AssetPropertyNotFoundException("Uri")

  suspend fun getWidth(): Int =
    contentResolver.queryAssetWidth(contentUri)
      ?: throw AssetPropertyNotFoundException("Width")

  fun getMimeType(): String? {
    return contentResolver.getType(contentUri)
  }

  suspend fun move(targetRelativePath: String) = withContext(Dispatchers.IO) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      // updateRelativePath updates also a file localisation in the file system
      contentResolver.updateRelativePath(contentUri, targetRelativePath)
    } else {
      moveManually(targetRelativePath)
    }
  }

  private suspend fun moveManually(targetRelativePath: String) = withContext(Dispatchers.IO) {
    val newAssetUri = contentResolver.insertPendingAsset(getFilename(), getMimeType(), targetRelativePath)
    contentResolver.copyUriContent(contentUri, newAssetUri)
    this@Asset.contentUri = newAssetUri
  }

  suspend fun delete() = withContext(Dispatchers.IO) {
    // Android versions 29 and earlier requires to manually remove a file
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      if (!File(getUri()).delete()) {
        throw AssetFileException("Could not delete file.")
      }
    }
    contentResolver.delete(contentUri, null, null)
  }
}
