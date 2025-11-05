package expo.modules.medialibrary.next.objects.asset.deleters

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.queryAssetPath
import expo.modules.medialibrary.next.permissions.SystemPermissionsDelegate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference

@DeprecatedSinceApi(Build.VERSION_CODES.R)
class AssetLegacyDeleter(
  val systemPermissionsDelegate: SystemPermissionsDelegate,
  context: Context
) : AssetDeleter {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  override suspend fun delete(contentUri: Uri): Unit = withContext(Dispatchers.IO) {
    systemPermissionsDelegate.requireWritePermissions()
    val path = contentResolver.queryAssetPath(contentUri)
      ?: throw AssetPropertyNotFoundException("Uri")
    if (!File(path).delete()) {
      throw AssetFileException("Could not delete a file.")
    }
    contentResolver.delete(contentUri, null, null)
  }

  override suspend fun delete(contentUris: List<Uri>): Unit = withContext(Dispatchers.IO) {
    contentUris.map { uri ->
      async {
        runCatching {
          delete(uri)
        }
      }
    }.awaitAll()
  }
}
