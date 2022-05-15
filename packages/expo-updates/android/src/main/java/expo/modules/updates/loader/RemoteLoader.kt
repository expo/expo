package expo.modules.updates.loader

import android.content.Context
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.FileDownloader.AssetDownloadCallback
import expo.modules.updates.loader.FileDownloader.ManifestDownloadCallback
import java.io.File

/**
 * Subclass of [Loader] which handles downloading updates from a remote server.
 *
 * Unlike [EmbeddedLoader], it needs to manage file downloading. Currently, it does not skip
 * any assets, meaning all assets must be downloaded in order for the update to be considered
 * ready to launch.
 */
class RemoteLoader internal constructor(
  context: Context,
  configuration: UpdatesConfiguration,
  database: UpdatesDatabase,
  private val mFileDownloader: FileDownloader,
  updatesDirectory: File?,
  private val launchedUpdate: UpdateEntity?,
  private val loaderFiles: LoaderFiles
) : Loader(context, configuration, database, updatesDirectory, loaderFiles) {
  constructor(
    context: Context,
    configuration: UpdatesConfiguration,
    database: UpdatesDatabase,
    fileDownloader: FileDownloader,
    updatesDirectory: File?,
    launchedUpdate: UpdateEntity?
  ) : this(context, configuration, database, fileDownloader, updatesDirectory, launchedUpdate, LoaderFiles())

  override fun loadManifest(
    context: Context,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
    callback: ManifestDownloadCallback
  ) {
    val embeddedUpdate = loaderFiles.readEmbeddedManifest(context, configuration)?.updateEntity
    val extraHeaders = FileDownloader.getExtraHeaders(database, configuration, launchedUpdate, embeddedUpdate)
    mFileDownloader.downloadManifest(configuration, extraHeaders, context, callback)
  }

  override fun loadAsset(
    context: Context,
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
    callback: AssetDownloadCallback
  ) {
    mFileDownloader.downloadAsset(assetEntity, updatesDirectory, configuration, context, callback)
  }

  override fun shouldSkipAsset(assetEntity: AssetEntity): Boolean {
    return false
  }

  companion object {
    private val TAG = RemoteLoader::class.java.simpleName
  }
}
