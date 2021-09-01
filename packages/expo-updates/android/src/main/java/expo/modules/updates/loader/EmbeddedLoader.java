package expo.modules.updates.loader;

import android.content.Context;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.manifest.UpdateManifest;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Date;

public class EmbeddedLoader extends Loader {

  private static final String TAG = EmbeddedLoader.class.getSimpleName();

  public static final String BUNDLE_FILENAME = "app.bundle";
  public static final String BARE_BUNDLE_FILENAME = "index.android.bundle";

  private Context mContext;
  private UpdatesConfiguration mConfiguration;
  private float mPixelDensity;

  private LoaderFiles mLoaderFiles;

  public EmbeddedLoader(Context context, UpdatesConfiguration configuration, UpdatesDatabase database, File updatesDirectory) {
    this(context, configuration, database, updatesDirectory, new LoaderFiles());
  }

  // for testing purposes
  EmbeddedLoader(Context context, UpdatesConfiguration configuration, UpdatesDatabase database, File updatesDirectory, LoaderFiles loaderFiles) {
    super(context, configuration, database, updatesDirectory, loaderFiles);
    mContext = context;
    mConfiguration = configuration;
    mPixelDensity = context.getResources().getDisplayMetrics().density;
    mLoaderFiles = loaderFiles;
  }

  @Override
  protected void loadManifest(Context context, UpdatesDatabase database, UpdatesConfiguration configuration, FileDownloader.ManifestDownloadCallback callback) {
    UpdateManifest updateManifest = mLoaderFiles.readEmbeddedManifest(mContext, mConfiguration);
    if (updateManifest != null) {
      callback.onSuccess(updateManifest);
    } else {
      String message = "Embedded manifest is null";
      callback.onFailure(message, new Exception(message));
    }
  }

  @Override
  protected void loadAsset(AssetEntity assetEntity, File updatesDirectory, UpdatesConfiguration configuration, FileDownloader.AssetDownloadCallback callback) {
    String filename = UpdatesUtils.createFilenameForAsset(assetEntity);
    File destination = new File(updatesDirectory, filename);

    if (mLoaderFiles.fileExists(destination)) {
      assetEntity.relativePath = filename;
      callback.onSuccess(assetEntity, false);
    } else {
      try {
        assetEntity.hash = mLoaderFiles.copyAssetAndGetHash(assetEntity, destination, mContext);
        assetEntity.downloadTime = new Date();
        assetEntity.relativePath = filename;
        callback.onSuccess(assetEntity, true);
      } catch (FileNotFoundException e) {
        throw new AssertionError("APK bundle must contain the expected embedded asset " +
                (assetEntity.embeddedAssetFilename != null ? assetEntity.embeddedAssetFilename : assetEntity.resourcesFilename));
      } catch (Exception e) {
        callback.onFailure(e, assetEntity);
      }
    }
  }

  @Override
  protected boolean shouldSkipAsset(AssetEntity asset) {
    if (asset.scales == null || asset.scale == null) {
      return false;
    }
    return pickClosestScale(asset.scales) != asset.scale;
  }

  // https://developer.android.com/guide/topics/resources/providing-resources.html#BestMatch
  // If a perfect match is not available, the OS will pick the next largest scale.
  // If only smaller scales are available, the OS will choose the largest available one.
  private float pickClosestScale(Float[] scales) {
    float closestScale = Float.MAX_VALUE;
    float largestScale = 0;
    for (float scale : scales) {
      if (scale >= mPixelDensity && (scale < closestScale)) {
        closestScale = scale;
      }
      if (scale > largestScale) {
        largestScale = scale;
      }
    }
    return closestScale < Float.MAX_VALUE ? closestScale : largestScale;
  }
}
