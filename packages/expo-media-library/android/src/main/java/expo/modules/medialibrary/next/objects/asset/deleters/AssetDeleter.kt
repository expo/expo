package expo.modules.medialibrary.next.objects.asset.deleters

import android.net.Uri

interface AssetDeleter {
  suspend fun delete(contentUri: Uri)
  suspend fun delete(contentUris: List<Uri>)
}
