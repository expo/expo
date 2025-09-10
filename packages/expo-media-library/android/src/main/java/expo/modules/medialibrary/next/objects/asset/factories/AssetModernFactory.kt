package expo.modules.medialibrary.next.objects.asset.factories

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.copyUriContent
import expo.modules.medialibrary.next.extensions.resolver.insertPendingAsset
import expo.modules.medialibrary.next.extensions.resolver.publishPendingAsset
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

@RequiresApi(Build.VERSION_CODES.Q)
class AssetModernFactory(context: Context) : AssetFactory {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  override suspend fun create(filePath: Uri, relativePath: RelativePath?): Asset = withContext(Dispatchers.IO) {
    val mimeType = contentResolver.getType(filePath)?.let { MimeType(it) }
      ?: MimeType.from(filePath)
    val displayName = filePath.lastPathSegment ?: ""
    val path = relativePath ?: RelativePath.create(mimeType)

    val contentUri = contentResolver.insertPendingAsset(displayName, mimeType, path)
    ensureActive()
    contentResolver.copyUriContent(filePath, contentUri)
    ensureActive()
    contentResolver.publishPendingAsset(contentUri)
    return@withContext Asset(contentUri, contextRef.getOrThrow())
  }
}
