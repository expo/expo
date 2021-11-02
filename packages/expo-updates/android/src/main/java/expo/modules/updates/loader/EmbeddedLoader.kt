package expo.modules.updates.loader

import android.content.Context
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.loader.FileDownloader.AssetDownloadCallback
import expo.modules.updates.loader.FileDownloader.ManifestDownloadCallback
import expo.modules.updates.UpdatesUtils
import java.io.File
import java.io.FileNotFoundException
import java.lang.AssertionError
import java.lang.Exception
import java.util.*

/**
 * Subclass of [Loader] which handles copying the embedded update's assets into the
 * expo-updates cache location.
 *
 * Rather than launching the embedded update directly from its location in the app bundle/apk, we
 * first try to read it into the expo-updates cache and database and launch it like any other
 * update. The benefits of this include (a) a single code path for launching most updates and (b)
 * assets included in embedded updates and copied into the cache in this way do not need to be
 * redownloaded if included in future updates.
 *
 * However, if a visual asset is included at multiple scales in an embedded update, we don't have
 * access to and must skip copying scales that don't match the resolution of the current device. In
 * this case, we cannot fully copy the embedded update, and instead launch it from the original
 * location. We still copy the assets we can so they don't need to be redownloaded in the future.
 */
class EmbeddedLoader internal constructor(
  private val context: Context,
  private val configuration: UpdatesConfiguration,
  database: UpdatesDatabase,
  updatesDirectory: File?,
  private val loaderFiles: LoaderFiles
) : Loader(
  context, configuration, database, updatesDirectory, loaderFiles
) {
  private val pixelDensity = context.resources.displayMetrics.density

  constructor(
    context: Context,
    configuration: UpdatesConfiguration,
    database: UpdatesDatabase,
    updatesDirectory: File?
  ) : this(context, configuration, database, updatesDirectory, LoaderFiles()) {
  }

  override fun loadManifest(
    context: Context,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
    callback: ManifestDownloadCallback
  ) {
    val updateManifest = loaderFiles.readEmbeddedManifest(this.context, this.configuration)
    if (updateManifest != null) {
      callback.onSuccess(updateManifest)
    } else {
      val message = "Embedded manifest is null"
      callback.onFailure(message, Exception(message))
    }
  }

  override fun loadAsset(
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
    callback: AssetDownloadCallback
  ) {
    val filename = UpdatesUtils.createFilenameForAsset(assetEntity)
    val destination = File(updatesDirectory, filename)

    if (loaderFiles.fileExists(destination)) {
      assetEntity.relativePath = filename
      callback.onSuccess(assetEntity, false)
    } else {
      try {
        assetEntity.hash = loaderFiles.copyAssetAndGetHash(assetEntity, destination, context)
        assetEntity.downloadTime = Date()
        assetEntity.relativePath = filename
        callback.onSuccess(assetEntity, true)
      } catch (e: FileNotFoundException) {
        throw AssertionError(
          "APK bundle must contain the expected embedded asset " +
            if (assetEntity.embeddedAssetFilename != null) assetEntity.embeddedAssetFilename else assetEntity.resourcesFilename
        )
      } catch (e: Exception) {
        callback.onFailure(e, assetEntity)
      }
    }
  }

  override fun shouldSkipAsset(assetEntity: AssetEntity): Boolean {
    return if (assetEntity.scales == null || assetEntity.scale == null) {
      false
    } else pickClosestScale(assetEntity.scales!!) != assetEntity.scale
  }

  // https://developer.android.com/guide/topics/resources/providing-resources.html#BestMatch
  // If a perfect match is not available, the OS will pick the next largest scale.
  // If only smaller scales are available, the OS will choose the largest available one.
  private fun pickClosestScale(scales: Array<Float>): Float {
    var closestScale = Float.MAX_VALUE
    var largestScale = 0f
    for (scale in scales) {
      if (scale >= pixelDensity && scale < closestScale) {
        closestScale = scale
      }
      if (scale > largestScale) {
        largestScale = scale
      }
    }
    return if (closestScale < Float.MAX_VALUE) closestScale else largestScale
  }

  companion object {
    private val TAG = EmbeddedLoader::class.java.simpleName

    const val BUNDLE_FILENAME = "app.bundle"
    const val BARE_BUNDLE_FILENAME = "index.android.bundle"
  }
}
