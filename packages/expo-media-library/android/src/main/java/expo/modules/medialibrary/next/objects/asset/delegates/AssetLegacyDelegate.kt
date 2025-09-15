package expo.modules.medialibrary.next.objects.asset.delegates

import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import androidx.core.net.toUri
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.next.exceptions.AssetCouldNotBeCreated
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.deleteBy
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDuration
import expo.modules.medialibrary.next.extensions.resolver.queryAssetHeight
import expo.modules.medialibrary.next.extensions.resolver.queryAssetModificationTime
import expo.modules.medialibrary.next.extensions.resolver.queryAssetPath
import expo.modules.medialibrary.next.extensions.resolver.queryAssetWidth
import expo.modules.medialibrary.next.extensions.resolver.queryGetCreationTime
import expo.modules.medialibrary.next.extensions.safeCopy
import expo.modules.medialibrary.next.extensions.safeMove
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference

@DeprecatedSinceApi(Build.VERSION_CODES.Q)
class AssetLegacyDelegate(contentUri: Uri, context: Context) : AssetDelegate {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  // This property is mutable for legacy asset and immutable for modern one.
  // In newer Android versions the contentResolver can update corresponding files in the
  // file system keeping always the same contentUri, whereas on older versions it is required
  // to sometimes (e.g. in `move` function) delete the old file and insert a new entry to
  // the database resulting in creating a new contentUri.
  override var contentUri: Uri = contentUri
    private set

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

  override suspend fun getMimeType(): MimeType {
    return contentResolver.getType(contentUri)?.let { MimeType(it) }
      ?: MimeType.from(getUri())
  }

  override suspend fun delete(): Unit = withContext(Dispatchers.IO) {
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Uri")
    if (!File(path).delete()) {
      throw AssetFileException("Could not delete file.")
    }
    contentResolver.delete(contentUri, null, null)
  }

  override suspend fun getUri(): Uri {
    // e.g. storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Uri")
    // e.g. file:///storage/emulated/0/Android/data/expo/files/[ROOT_ALBUM]/[ALBUM_NAME]
    val uri = File(path).toUri()
    return uri
  }

  override suspend fun move(relativePath: RelativePath) = withContext(Dispatchers.IO) {
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Asset path")
    val newFile = File(path).safeMove(File(relativePath.toFilePath()))
    contentResolver.deleteBy(path)
    val (_, uri) = MediaLibraryUtils.scanFile(contextRef.getOrThrow(), arrayOf(newFile.path), null)
    this@AssetLegacyDelegate.contentUri = uri
      ?: throw AssetCouldNotBeCreated("Could not create a new asset while moving the old one")
  }

  override suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Asset path")
    val newFile = File(path).safeCopy(File(relativePath.toFilePath()))
    val (_, uri) = MediaLibraryUtils.scanFile(contextRef.getOrThrow(), arrayOf(newFile.path), null)
    if (uri == null) {
      throw AssetCouldNotBeCreated("Could not create a new asset while copying the old one")
    }
    return@withContext Asset(uri, contextRef.getOrThrow())
  }
}
