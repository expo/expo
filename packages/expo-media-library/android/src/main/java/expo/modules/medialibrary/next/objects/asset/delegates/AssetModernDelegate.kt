package expo.modules.medialibrary.next.objects.asset.delegates

import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.net.toUri
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.publishPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDuration
import expo.modules.medialibrary.next.extensions.resolver.queryAssetHeight
import expo.modules.medialibrary.next.extensions.resolver.queryAssetModificationTime
import expo.modules.medialibrary.next.extensions.resolver.queryAssetPath
import expo.modules.medialibrary.next.extensions.resolver.queryAssetWidth
import expo.modules.medialibrary.next.extensions.resolver.queryGetCreationTime
import expo.modules.medialibrary.next.extensions.resolver.updateRelativePath
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference

@RequiresApi(Build.VERSION_CODES.Q)
class AssetModernDelegate(override val contentUri: Uri, context: Context) : AssetDelegate {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  override suspend fun getCreationTime(): Long? {
    return contentResolver
      .queryGetCreationTime(contentUri)
      .takeIf { it != 0L }
  }

  override suspend fun getDuration(): Long? {
    return if (getMimeType().isVideo()) {
      contentResolver
        .queryAssetDuration(contentUri)
        .takeIf { it != 0L }
    } else {
      null
    }
  }

  override suspend fun getFilename(): String =
    contentResolver.queryAssetDisplayName(contentUri)
      ?: throw AssetPropertyNotFoundException("Filename")

  override suspend fun getHeight(): Int {
    val height = contentResolver.queryAssetHeight(contentUri)
      ?: throw AssetPropertyNotFoundException("Height")
    // If height is not saved to the database
    if (getMediaType() == MediaType.IMAGE && height <= 0) {
      return downloadBitmapAndGet { it.outHeight }
    }
    return height
  }

  override suspend fun getWidth(): Int {
    val width = contentResolver.queryAssetWidth(contentUri)
      ?: throw AssetPropertyNotFoundException("Width")
    if (getMediaType() == MediaType.IMAGE && width <= 0) {
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

  override suspend fun getMediaType(): MediaType =
    MediaType.fromContentUri(contentUri)

  override suspend fun getModificationTime(): Long? =
    contentResolver.queryAssetModificationTime(contentUri).takeIf { it != 0L }

  override suspend fun getUri(): Uri {
    // e.g. storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Uri")
    // e.g. file:///storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val uri = File(path).toUri()
    return uri
  }

  override suspend fun getMimeType(): MimeType {
    return contentResolver.getType(contentUri)?.let { MimeType(it) }
      ?: MimeType.from(getUri())
  }

  override suspend fun delete() {
    contentResolver.delete(contentUri, null, null)
  }

  override suspend fun move(relativePath: RelativePath) {
    contentResolver.updateRelativePath(contentUri, relativePath)
  }

  override suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    val newAssetUri = contentResolver.insertPendingAsset(getFilename(), getMimeType(), relativePath)
    contentResolver.copyUriContent(contentUri, newAssetUri)
    contentResolver.publishPendingAsset(newAssetUri)
    return@withContext Asset(newAssetUri, contextRef.getOrThrow())
  }
}
