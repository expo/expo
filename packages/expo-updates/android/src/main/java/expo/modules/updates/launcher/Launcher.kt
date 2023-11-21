package expo.modules.updates.launcher

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity

data class LauncherResult(
  val launchedUpdate: UpdateEntity?,

  /**
   * Used by React Native to launch the app when the launch asset (JS bundle or HBC) is located on
   * the device's file system.
   */
  val launchAssetFile: String?,

  /**
   * Used by React Native to launch the app when the launch asset (JS bundle or HBC) is embedded in
   * the application package.
   */
  val bundleAssetName: String?,

  /**
   * Exported to JS through [UpdatesModule] for use by the expo-asset package. Used to map
   * references to `require`d assets to files on disk.
   */
  val localAssetFiles: Map<AssetEntity, String>?,

  /**
   * Exported to JS through [UpdatesModule] for use by the expo-asset package. Used to determine
   * whether to map references to `require`d assets to files embedded in the application package.
   */
  val isUsingEmbeddedAssets: Boolean,
)
