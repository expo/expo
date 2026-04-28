package expo.modules.medialibrary.next.objects.asset.movers

import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.RelativePath

@DeprecatedSinceApi(Build.VERSION_CODES.R)
class AssetLegacyMover : AssetMover {
  override suspend fun moveAssets(assets: List<Asset>, relativePath: RelativePath) {
    assets.forEach { it.move(relativePath) }
  }
}
