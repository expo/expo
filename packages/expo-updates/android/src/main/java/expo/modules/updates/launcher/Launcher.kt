package expo.modules.updates.launcher

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity

interface Launcher {
  interface LauncherCallback {
    fun onFailure(e: Exception)
    fun onSuccess()
  }

  val launchedUpdate: UpdateEntity?
  val launchAssetFile: String?
  val bundleAssetName: String?
  val localAssetFiles: Map<AssetEntity, String>?
  val isUsingEmbeddedAssets: Boolean
}
