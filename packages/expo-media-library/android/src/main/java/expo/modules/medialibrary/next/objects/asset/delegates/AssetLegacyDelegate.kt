package expo.modules.medialibrary.next.objects.asset.delegates

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.next.exceptions.AssetCouldNotBeCreated
import expo.modules.medialibrary.next.exceptions.AssetInitializationException
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.deleteBy
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetPath
import expo.modules.medialibrary.next.extensions.resolver.queryGetCreationTime
import expo.modules.medialibrary.next.extensions.safeCopy
import expo.modules.medialibrary.next.extensions.safeMove
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class AssetLegacyDelegate(contentUri: Uri, val context: Context) : AssetDelegate {
  private val contentResolver by lazy {
    context.contentResolver ?: throw AssetInitializationException("Unable to access the contentResolver")
  }

  // This property is mutable for legacy asset and immutable for modern one.
  // In newer Android versions the contentResolver can update corresponding files in the
  // file system keeping always the same contentUri, whereas on older versions it is required
  // to sometimes (e.g. in `move` function) delete the old file and insert a new entry to
  // the database resulting in creating a new contentUri.
  override var contentUri: Uri = contentUri
    private set

  override suspend fun getCreationTime(): Long? {
    return contentResolver.queryGetCreationTime(contentUri).takeIf { it != 0L }
  }

  override suspend fun getFilename(): String =
    contentResolver.queryAssetDisplayName(contentUri)
      ?: throw AssetPropertyNotFoundException("Filename")

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
    val (_, uri) = MediaLibraryUtils.scanFile(context, arrayOf(newFile.path), null)
    this@AssetLegacyDelegate.contentUri = uri
      ?: throw AssetCouldNotBeCreated("Could not create a new asset while moving the old one")
  }

  override suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Asset path")
    val newFile = File(path).safeCopy(File(relativePath.toFilePath()))
    val (_, uri) = MediaLibraryUtils.scanFile(context, arrayOf(newFile.path), null)
    if (uri == null) {
      throw AssetCouldNotBeCreated("Could not create a new asset while copying the old one")
    }
    return@withContext Asset(uri, context)
  }
}
