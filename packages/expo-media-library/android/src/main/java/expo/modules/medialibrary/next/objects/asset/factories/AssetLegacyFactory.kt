package expo.modules.medialibrary.next.objects.asset.factories

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.next.exceptions.AssetCouldNotBeCreated
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File

class AssetLegacyFactory(val context: Context) : AssetFactory {
  private val contentResolver
    get() = context.contentResolver
      ?: throw AssetCouldNotBeCreated("Failed to create asset: ContentResolver is unavailable.")

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
    val (_, uri) = MediaLibraryUtils.scanFile(context, arrayOf(destFile.toString()), null)
    coroutineContext.ensureActive()

    if (uri == null) {
      throw AssetCouldNotBeCreated("Failed to create asset: could not add asset to MediaStore")
    }
    return@withContext Asset(uri, context)
  }
}
