package expo.modules.updates.launcher

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity

/**
 * Provides an interface through which an update can be launched from disk. Classes that implement
 * this interface are responsible for selecting an eligible update to launch, ensuring all
 * required assets are present, and providing the fields here.
 */
interface Launcher {
  interface LauncherCallback {
    fun onFailure(e: Exception)
    fun onSuccess()
  }

  val launchedUpdate: UpdateEntity?

  /**
   * Used by React Native to launch the app when the launch asset (JS bundle or HBC) is located on
   * the device's file system.
   */
  val launchAssetFile: String?

  /**
   * Used by React Native to launch the app when the launch asset (JS bundle or HBC) is embedded in
   * the application package.
   */
  val bundleAssetName: String?

  /**
   * Exported to JS through [UpdatesModule] for use by the expo-asset package. Used to map
   * references to `require`d assets to files on disk.
   */
  val localAssetFiles: Map<AssetEntity, String>?

  /**
   * Exported to JS through [UpdatesModule] for use by the expo-asset package. Used to determine
   * whether to map references to `require`d assets to files embedded in the application package.
   */
  val isUsingEmbeddedAssets: Boolean
}
