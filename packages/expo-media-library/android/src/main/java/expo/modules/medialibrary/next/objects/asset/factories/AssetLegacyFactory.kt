package expo.modules.medialibrary.next.objects.asset.factories

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import androidx.core.net.toUri
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.next.exceptions.AssetCouldNotBeCreated
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference

@DeprecatedSinceApi(Build.VERSION_CODES.Q)
class AssetLegacyFactory(context: Context) : AssetFactory {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  override suspend fun create(filePath: Uri, relativePath: RelativePath?): Asset = withContext(Dispatchers.IO) {
    val mimeType = contentResolver.getType(filePath)?.let { MimeType(it) }
      ?: MimeType.from(filePath)
    val displayName = filePath.lastPathSegment ?: ""
    val baseDir = if (relativePath != null) {
      File(relativePath.toFilePath())
    } else {
      mimeType.externalStoragePublicDirectory()
    }
    baseDir.mkdirs()

    val destFile = File(baseDir, displayName)
    contentResolver.copyUriContent(filePath, destFile.toUri())
    val (_, uri) = MediaLibraryUtils.scanFile(contextRef.getOrThrow(), arrayOf(destFile.toString()), null)
    coroutineContext.ensureActive()

    if (uri == null) {
      throw AssetCouldNotBeCreated("Failed to create asset: could not add asset to MediaStore")
    }
    return@withContext Asset(uri, contextRef.getOrThrow())
  }
}
