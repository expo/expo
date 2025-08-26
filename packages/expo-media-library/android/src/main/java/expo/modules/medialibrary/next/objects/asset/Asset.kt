package expo.modules.medialibrary.next.objects.asset

import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import androidx.core.net.toUri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDuration
import expo.modules.medialibrary.next.extensions.resolver.queryAssetHeight
import expo.modules.medialibrary.next.extensions.resolver.queryAssetModificationTime
import expo.modules.medialibrary.next.extensions.resolver.queryAssetPath
import expo.modules.medialibrary.next.extensions.resolver.queryAssetWidth
import expo.modules.medialibrary.next.extensions.resolver.queryGetCreationTime
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.delegates.AssetLegacyDelegate
import expo.modules.medialibrary.next.objects.asset.delegates.AssetModernDelegate
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.getValue

class Asset(contentUri: Uri, val context: Context) : SharedObject() {
  val assetDelegate by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      AssetModernDelegate(contentUri, context)
    } else {
      AssetLegacyDelegate(contentUri, context)
    }
  }

  val contentUri: Uri get() = assetDelegate.contentUri

  private val contentResolver by lazy {
    context.contentResolver ?: throw Exceptions.ReactContextLost()
  }

  suspend fun getCreationTime(): Long? =
    contentResolver
      .queryGetCreationTime(contentUri)
      .takeIf { it != 0L }

  suspend fun getDuration(): Long? {
    return if (getMimeType()?.isVideo() == true) {
      contentResolver
        .queryAssetDuration(contentUri)
        .takeIf { it != 0L }
    } else {
      null
    }
  }

  suspend fun getFilename(): String =
    contentResolver.queryAssetDisplayName(contentUri)
      ?: throw AssetPropertyNotFoundException("Filename")

  suspend fun getHeight(): Int {
    val height = contentResolver.queryAssetHeight(contentUri)
      ?: throw AssetPropertyNotFoundException("Height")
    // Fallback when height is not saved to the database
    if (getMediaType().contains("image") && height <= 0) {
      return downloadBitmapAndGet { it.outHeight }
    }
    return height
  }

  suspend fun getWidth(): Int {
    val width = contentResolver.queryAssetWidth(contentUri)
      ?: throw AssetPropertyNotFoundException("Width")
    if (getMediaType().contains("image") && width <= 0) {
      return downloadBitmapAndGet { it.outWidth }
    }
    return width
  }

  private suspend fun downloadBitmapAndGet(extract: (BitmapFactory.Options) -> Int): Int {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    val stringAssetUri = contentResolver.queryAssetPath(contentUri)
    BitmapFactory.decodeFile(stringAssetUri, options)
    return extract(options)
  }

  fun getMediaType(): String {
    return contentResolver.getType(contentUri)
      ?: throw AssetPropertyNotFoundException("MediaType")
  }

  suspend fun getModificationTime(): Long? =
    contentResolver.queryAssetModificationTime(contentUri).takeIf { it != 0L }

  suspend fun getUri(): Uri {
    // e.g. storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Uri")
    // e.g. file:///storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val uri = File(path).toUri()
    return uri
  }

  suspend fun getMimeType(): MimeType {
    return assetDelegate.getMimeType()
  }

  suspend fun move(relativePath: RelativePath) = withContext(Dispatchers.IO) {
    assetDelegate.move(relativePath)
  }

  suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    return@withContext assetDelegate.copy(relativePath)
  }

  suspend fun delete() = withContext(Dispatchers.IO) {
    assetDelegate.delete()
  }
}
