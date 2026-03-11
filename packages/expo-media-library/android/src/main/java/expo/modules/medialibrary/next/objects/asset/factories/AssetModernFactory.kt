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
import expo.modules.medialibrary.next.objects.asset.delegates.AssetDelegate
import expo.modules.medialibrary.next.objects.asset.delegates.AssetModernDelegate
import expo.modules.medialibrary.next.objects.asset.deleters.AssetDeleter
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import expo.modules.medialibrary.next.permissions.MediaStorePermissionsDelegate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

@RequiresApi(Build.VERSION_CODES.R)
class AssetModernFactory(
  val assetDeleter: AssetDeleter,
  val mediaStorePermissionsDelegate: MediaStorePermissionsDelegate,
  context: Context
) : AssetFactory {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  private fun createAssetDelegate(contentUri: Uri): AssetDelegate {
    return AssetModernDelegate(
      contentUri,
      assetDeleter,
      mediaStorePermissionsDelegate,
      contextRef.getOrThrow()
    )
  }

  override fun create(contentUri: Uri): Asset {
    val assetDelegate = createAssetDelegate(contentUri)
    return Asset(assetDelegate)
  }

  override suspend fun create(filePath: Uri, relativePath: RelativePath?): Asset {
    return createAssetInternal(filePath, relativePath, forceUniqueName = false)
  }

  private suspend fun createAssetInternal(
    filePath: Uri,
    relativePath: RelativePath?,
    forceUniqueName: Boolean
  ): Asset = withContext(Dispatchers.IO) {
    val mimeType = contentResolver.getType(filePath)?.let { MimeType(it) }
      ?: MimeType.from(filePath)
    val displayName = if (forceUniqueName) {
      buildUniqueDisplayName(filePath)
    } else {
      filePath.lastPathSegment ?: "asset"
    }
    val path = relativePath ?: RelativePath.create(mimeType)

    val pendingUri = contentResolver.insertPendingAsset(displayName, mimeType, path)
    return@withContext try {
      ensureActive()
      contentResolver.copyUriContent(filePath, pendingUri)
      ensureActive()
      contentResolver.publishPendingAsset(pendingUri)
      create(pendingUri)
    } catch (e: IllegalStateException) {
      contentResolver.delete(pendingUri, null, null)
      // It occurs when trying to create too many assets with the same filename in the same album.
      // By default, the Content Resolver can resolve this issue for up to 32 assets, but then it throws this exception.
      val isCollisionError = e.message?.contains("Failed to build unique file", ignoreCase = true) == true
      if (isCollisionError && !forceUniqueName) {
        createAssetInternal(filePath, relativePath, forceUniqueName = true)
      } else {
        throw e
      }
    }
  }
}
