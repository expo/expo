package expo.modules.medialibrary.next.objects.asset.deleters

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

// On Android 29 (Android 10) you don't need to manually delete files with File.delete() -
// contentResolver does is under the hood, but MediaStore.createDeleteRequest() is not available yet.
// Therefore, the app still requires WRITE_EXTERNAL_STORAGE permission to delete media.
@RequiresApi(Build.VERSION_CODES.Q)
@DeprecatedSinceApi(Build.VERSION_CODES.R)
class AssetIntermediateDeleter(context: Context): AssetDeleter {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  override suspend fun delete(contentUri: Uri): Unit = withContext(Dispatchers.IO) {
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