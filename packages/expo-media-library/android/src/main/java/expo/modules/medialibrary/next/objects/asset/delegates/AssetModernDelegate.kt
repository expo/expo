package expo.modules.medialibrary.next.objects.asset.delegates

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.net.toUri
import expo.modules.medialibrary.next.exceptions.AssetInitializationException
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.publishPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.queryAssetDisplayName
import expo.modules.medialibrary.next.extensions.resolver.queryAssetPath
import expo.modules.medialibrary.next.extensions.resolver.queryGetCreationTime
import expo.modules.medialibrary.next.extensions.resolver.updateRelativePath
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

@RequiresApi(Build.VERSION_CODES.Q)
class AssetModernDelegate(override val contentUri: Uri, val context: Context) : AssetDelegate {
  private val contentResolver by lazy {
    context.contentResolver ?: throw AssetInitializationException("Unable to access the contentResolver")
  }

  override suspend fun getCreationTime(): Long? {
    return contentResolver.queryGetCreationTime(contentUri).takeIf { it != 0L }
  }

  override suspend fun move(relativePath: RelativePath) {
    contentResolver.updateRelativePath(contentUri, relativePath)
  }

  override suspend fun delete() {
    contentResolver.delete(contentUri, null, null)
  }

  override suspend fun getFilename(): String =
    contentResolver.queryAssetDisplayName(contentUri)
      ?: throw AssetPropertyNotFoundException("Filename")

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

  override suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    val newAssetUri = contentResolver.insertPendingAsset(getFilename(), getMimeType(), relativePath)
    contentResolver.copyUriContent(contentUri, newAssetUri)
    contentResolver.publishPendingAsset(newAssetUri)
    return@withContext Asset(newAssetUri, context)
  }
}
