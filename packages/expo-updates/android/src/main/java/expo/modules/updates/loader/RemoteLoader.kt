package expo.modules.updates.loader

import android.content.Context
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.UpdateManifest
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
  loaderFiles: LoaderFiles
) : Loader(context, configuration, database, updatesDirectory, loaderFiles) {
  constructor(
    context: Context,
    configuration: UpdatesConfiguration,
    database: UpdatesDatabase,
    fileDownloader: FileDownloader,
    updatesDirectory: File?
  ) : this(context, configuration, database, fileDownloader, updatesDirectory, LoaderFiles())

  override suspend fun loadManifest(
    context: Context,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
  ): UpdateManifest {
    val extraHeaders = ManifestMetadata.getServerDefinedHeaders(database, configuration)
    return mFileDownloader.downloadManifest(configuration, extraHeaders, context)
  }

  override suspend fun loadAsset(
    assetEntity: AssetEntity,
    updatesDirectory: File?,
    configuration: UpdatesConfiguration,
  ): FileDownloader.AssetDownloadResult {
    return mFileDownloader.downloadAsset(assetEntity, updatesDirectory, configuration)
  }

  override fun shouldSkipAsset(assetEntity: AssetEntity): Boolean {
    return false
  }

  companion object {
    private val TAG = RemoteLoader::class.java.simpleName
  }
}
