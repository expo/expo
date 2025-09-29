package expo.modules.medialibrary.next.objects.asset.factories

import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import androidx.core.net.toFile
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
import expo.modules.medialibrary.next.permissions.SystemPermissionsDelegate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

@DeprecatedSinceApi(Build.VERSION_CODES.R)
class AssetLegacyFactory(
  val assetDeleter: AssetDeleter,
  val systemPermissionsDelegate: SystemPermissionsDelegate,
  context: Context
) : AssetFactory {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  private fun createAssetDelegate(contentUri: Uri): AssetDelegate {
    return AssetLegacyDelegate(contentUri, assetDeleter, systemPermissionsDelegate,contextRef.getOrThrow())
  }

  override fun create(contentUri: Uri): Asset {
    val assetDelegate = createAssetDelegate(contentUri)
    return Asset(assetDelegate)
  }

  override suspend fun create(filePath: Uri, relativePath: RelativePath?): Asset = withContext(Dispatchers.IO) {
    systemPermissionsDelegate.requireWritePermissions()
    val destinationDirectory = createDestinationDirectory(filePath, relativePath)
    val destinationFile = filePath
      .toFile()
      .safeCopy(destinationDirectory)
    val (_, uri) = scanFile(contextRef.getOrThrow(), arrayOf(destinationFile.toString()), null)
    ensureActive()
    if (uri == null) {
      throw AssetCouldNotBeCreated("Failed to create asset: could not add asset to MediaStore")
    }
    return@withContext create(uri)
  }

  private fun createDestinationDirectory(filePath: Uri, relativePath: RelativePath?): File{
    val destinationDirectory = if (relativePath != null) {
      File(relativePath.toFilePath())
    } else {
      val mimeType = contentResolver.getType(filePath)?.let { MimeType(it) }
        ?: MimeType.from(filePath)
      mimeType.externalStorageAssetDirectory()
    }
    destinationDirectory.mkdirs()
    return destinationDirectory
  }

  private suspend fun scanFile(context: Context, paths: Array<String>, mimeTypes: Array<String>?) =
    suspendCoroutine { complete ->
      MediaScannerConnection.scanFile(context, paths, mimeTypes) { path: String, uri: Uri? ->
        complete.resume(Pair(path, uri))
      }
    }
}
