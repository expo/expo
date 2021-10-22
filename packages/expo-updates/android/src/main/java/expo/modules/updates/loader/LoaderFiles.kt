package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.UpdateManifest
import java.io.File
import java.io.IOException
import java.security.NoSuchAlgorithmException

/**
 * Utility class for Loader and its subclasses, to allow for easy mocking
 */
open class LoaderFiles {
  fun fileExists(destination: File): Boolean {
    return destination.exists()
  }

  fun readEmbeddedManifest(
    context: Context,
    configuration: UpdatesConfiguration
  ): UpdateManifest? {
    return EmbeddedManifest.get(context, configuration)
  }

  @Throws(NoSuchAlgorithmException::class, IOException::class)
  fun copyAssetAndGetHash(asset: AssetEntity, destination: File, context: Context): ByteArray {
    return if (asset.embeddedAssetFilename != null) {
      copyContextAssetAndGetHash(asset, destination, context)
    } else if (asset.resourcesFilename != null && asset.resourcesFolder != null) {
      copyResourceAndGetHash(asset, destination, context)
    } else {
      throw AssertionError("Failed to copy embedded asset " + asset.key + " from APK assets or resources because not enough information was provided.")
    }
  }

  @Throws(NoSuchAlgorithmException::class, IOException::class)
  internal fun copyContextAssetAndGetHash(
    asset: AssetEntity,
    destination: File,
    context: Context
  ): ByteArray {
    try {
      // no codesigning needed for embedded assets
      return UpdatesUtils.sha256AndWriteToDestinationFile(context.assets.open(asset.embeddedAssetFilename!!).readBytes(), destination)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to copy asset " + asset.embeddedAssetFilename, e)
      throw e
    }
  }

  @Throws(NoSuchAlgorithmException::class, IOException::class)
  internal fun copyResourceAndGetHash(
    asset: AssetEntity,
    destination: File,
    context: Context
  ): ByteArray {
    val id = context.resources.getIdentifier(
      asset.resourcesFilename,
      asset.resourcesFolder,
      context.packageName
    )
    try {
      // no codesigning needed for embedded resources
      return UpdatesUtils.sha256AndWriteToDestinationFile(context.resources.openRawResource(id).readBytes(), destination)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to copy asset " + asset.embeddedAssetFilename, e)
      throw e
    }
  }

  companion object {
    private val TAG = LoaderFiles::class.java.simpleName
  }
}
