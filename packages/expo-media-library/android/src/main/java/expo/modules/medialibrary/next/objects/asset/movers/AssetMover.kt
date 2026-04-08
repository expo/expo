package expo.modules.medialibrary.next.objects.asset.movers

import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.RelativePath

fun interface AssetMover {
  suspend fun moveAssets(assets: List<Asset>, relativePath: RelativePath)
}
