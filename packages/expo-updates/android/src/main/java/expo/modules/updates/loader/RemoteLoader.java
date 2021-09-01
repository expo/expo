package expo.modules.updates.loader;

import android.content.Context;

import org.json.JSONObject;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.manifest.ManifestMetadata;

import java.io.File;

public class RemoteLoader extends Loader {

  private static final String TAG = RemoteLoader.class.getSimpleName();

  private final FileDownloader mFileDownloader;

  public RemoteLoader(Context context, UpdatesConfiguration configuration, UpdatesDatabase database, FileDownloader fileDownloader, File updatesDirectory) {
    this(context, configuration, database, fileDownloader, updatesDirectory, new LoaderFiles());
  }

  // for testing purposes
  RemoteLoader(Context context, UpdatesConfiguration configuration, UpdatesDatabase database, FileDownloader fileDownloader, File updatesDirectory, LoaderFiles loaderFiles) {
    super(context, configuration, database, updatesDirectory, loaderFiles);
    mFileDownloader = fileDownloader;
  }

  @Override
  protected void loadManifest(Context context, UpdatesDatabase database, UpdatesConfiguration configuration, FileDownloader.ManifestDownloadCallback callback) {
    JSONObject extraHeaders = ManifestMetadata.getServerDefinedHeaders(database, configuration);
    mFileDownloader.downloadManifest(configuration, extraHeaders, context, callback);
  }

  @Override
  protected void loadAsset(AssetEntity assetEntity, File updatesDirectory, UpdatesConfiguration configuration, FileDownloader.AssetDownloadCallback callback) {
    mFileDownloader.downloadAsset(assetEntity, updatesDirectory, configuration, callback);
  }

  @Override
  protected boolean shouldSkipAsset(AssetEntity assetEntity) {
    return false;
  }
}
