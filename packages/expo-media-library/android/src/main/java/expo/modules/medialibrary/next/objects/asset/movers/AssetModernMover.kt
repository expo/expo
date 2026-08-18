package expo.modules.medialibrary.next.objects.asset.movers

import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.permissions.MediaStorePermissionsDelegate

@RequiresApi(Build.VERSION_CODES.R)
class AssetModernMover(
  private val mediaStorePermissionsDelegate: MediaStorePermissionsDelegate
) : AssetMover {
  override suspend fun moveAssets(assets: List<Asset>, relativePath: RelativePath) {
    mediaStorePermissionsDelegate.requestMediaLibraryWritePermission(assets.map { it.contentUri })
    assets.forEach { it.move(relativePath) }
  }
}
