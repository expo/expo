package expo.modules.updates.loader

import android.content.Context
import expo.modules.updates.BuildConfig
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.loader.FileDownloader.AssetDownloadCallback
import expo.modules.updates.loader.FileDownloader.RemoteUpdateDownloadCallback
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.utils.AndroidResourceAssetUtils
import java.io.File
import java.io.FileNotFoundException
import java.lang.AssertionError
import java.lang.Exception
import java.util.*

/**
 * Subclass of [Loader] which handles embedded update assets
 *
 * @param shouldCopyEmbeddedAssets if true, copying the embedded update's assets into the expo-updates cache location.
 *   Rather than launching the embedded update directly from its location in the app bundle/apk, we
 *   first try to read it into the expo-updates cache and database and launch it like any other
 *   update. The benefits of this include (a) a single code path for launching most updates and (b)
 *   assets included in embedded updates and copied into the cache in this way do not need to be
 *   re-downloaded if included in future updates.
 */
class EmbeddedLoader internal constructor(
  context: Context,
  private val configuration: UpdatesConfiguration,
  logger: UpdatesLogger,
  database: UpdatesDatabase,
  updatesDirectory: File,
  private val loaderFiles: LoaderFiles,
  private val shouldCopyEmbeddedAssets: Boolean = BuildConfig.EX_UPDATES_COPY_EMBEDDED_ASSETS
) : Loader(
  context,
  configuration,
  logger,
  database,
  updatesDirectory,
  loaderFiles
) {

  constructor(
    context: Context,
    configuration: UpdatesConfiguration,
    logger: UpdatesLogger,
    database: UpdatesDatabase,
    updatesDirectory: File
  ) : this(context, configuration, logger, database, updatesDirectory, LoaderFiles())

  override fun loadRemoteUpdate(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
    callback: RemoteUpdateDownloadCallback
  ) {
    val update = loaderFiles.readEmbeddedUpdate(this.context, this.configuration)
    if (update != null) {
      callback.onSuccess(
        UpdateResponse(
          responseHeaderData = null,
          manifestUpdateResponsePart = UpdateResponsePart.ManifestUpdateResponsePart(update),
          directiveUpdateResponsePart = null
        )
      )
    } else {
      callback.onFailure(Exception("Embedded manifest is null"))
    }
  }

  override fun loadAsset(
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
    requestedUpdate: UpdateEntity?,
    embeddedUpdate: UpdateEntity?,
    callback: AssetDownloadCallback
  ) {
    if (!shouldCopyEmbeddedAssets) {
      assetEntity.downloadTime = Date()
      assetEntity.relativePath = AndroidResourceAssetUtils.createEmbeddedFilenameForAsset(assetEntity)
      // Passing `isNew=true` aka `AssetLoadResult.FINISHED` to the callback,
      // because we assume embedded asset is always existed without filesystem out of sync.
      callback.onSuccess(assetEntity, true)
      return
    }

    val filename = UpdatesUtils.createFilenameForAsset(assetEntity)
    val destination = File(updatesDirectory, filename)

    if (loaderFiles.fileExists(context, updatesDirectory, filename)) {
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

  companion object {
    const val BUNDLE_FILENAME = "app.bundle"
    const val BARE_BUNDLE_FILENAME = "index.android.bundle"
  }
}
