package expo.modules.medialibrary.next.objects.asset.deleters

import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.next.permissions.MediaStorePermissionsDelegate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@RequiresApi(Build.VERSION_CODES.R)
class AssetModernDeleter(
  val mediaStorePermissionsDelegate: MediaStorePermissionsDelegate
): AssetDeleter{

  override suspend fun delete(contentUri: Uri) = withContext(Dispatchers.IO) {
    mediaStorePermissionsDelegate.launchMediaStoreDeleteRequest(listOf(contentUri))
  }

  override suspend fun delete(contentUris: List<Uri>) = withContext(Dispatchers.IO) {
    mediaStorePermissionsDelegate.launchMediaStoreDeleteRequest(contentUris)
  }
}