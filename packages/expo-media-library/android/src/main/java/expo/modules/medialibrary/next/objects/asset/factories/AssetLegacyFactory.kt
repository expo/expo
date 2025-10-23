package expo.modules.medialibrary.next.objects.asset.factories

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import androidx.core.net.toFile
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.next.exceptions.AssetCouldNotBeCreated
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.safeCopy
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.asset.delegates.AssetDelegate
import expo.modules.medialibrary.next.objects.asset.delegates.AssetLegacyDelegate
import expo.modules.medialibrary.next.objects.asset.deleters.AssetDeleter
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference

@DeprecatedSinceApi(Build.VERSION_CODES.R)
class AssetLegacyFactory(
  val assetDeleter: AssetDeleter,
  context: Context
) : AssetFactory {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  private fun createAssetDelegate(contentUri: Uri): AssetDelegate {
    return AssetLegacyDelegate(contentUri, assetDeleter, contextRef.getOrThrow())
  }

  override fun create(contentUri: Uri): Asset {
    val assetDelegate = createAssetDelegate(contentUri)
    return Asset(assetDelegate)
  }

  override suspend fun create(filePath: Uri, relativePath: RelativePath?): Asset = withContext(Dispatchers.IO) {
    val mimeType = contentResolver.getType(filePath)?.let { MimeType(it) }
      ?: MimeType.from(filePath)
    val destinationDirectory = if (relativePath != null) {
      File(relativePath.toFilePath())
    } else {
      mimeType.externalStorageAssetDirectory()
    }
    destinationDirectory.mkdirs()

    val destFile = filePath
      .toFile()
      .safeCopy(destinationDirectory)
    val (_, uri) = MediaLibraryUtils.scanFile(contextRef.getOrThrow(), arrayOf(destFile.toString()), null)
    coroutineContext.ensureActive()

    if (uri == null) {
      throw AssetCouldNotBeCreated("Failed to create asset: could not add asset to MediaStore")
    }
    return@withContext create(uri)
  }
}
