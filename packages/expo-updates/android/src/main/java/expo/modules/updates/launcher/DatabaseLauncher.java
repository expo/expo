package expo.modules.updates.launcher;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import androidx.annotation.Nullable;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.db.enums.UpdateStatus;
import expo.modules.updates.loader.EmbeddedLoader;
import expo.modules.updates.loader.FileDownloader;
import expo.modules.updates.manifest.Manifest;

public class DatabaseLauncher implements Launcher {

  private static final String TAG = DatabaseLauncher.class.getSimpleName();

  private File mUpdatesDirectory;
  private SelectionPolicy mSelectionPolicy;

  private UpdateEntity mLaunchedUpdate = null;
  private String mLaunchAssetFile = null;
  private String mBundleAssetName = null;
  private Map<AssetEntity, String> mLocalAssetFiles = null;

  private int mAssetsToDownload = 0;
  private int mAssetsToDownloadFinished = 0;
  private Exception mLaunchAssetException = null;

  private LauncherCallback mCallback = null;

  public DatabaseLauncher(File updatesDirectory, SelectionPolicy selectionPolicy) {
    mUpdatesDirectory = updatesDirectory;
    mSelectionPolicy = selectionPolicy;
  }

  public @Nullable UpdateEntity getLaunchedUpdate() {
    return mLaunchedUpdate;
  }

  public @Nullable String getLaunchAssetFile() {
    return mLaunchAssetFile;
  }

  public @Nullable String getBundleAssetName() {
    return mBundleAssetName;
  }

  public @Nullable Map<AssetEntity, String> getLocalAssetFiles() {
    return mLocalAssetFiles;
  }

  public boolean isUsingEmbeddedAssets() {
    return mLocalAssetFiles == null;
  }

  public synchronized void launch(UpdatesDatabase database, Context context, LauncherCallback callback) {
    if (mCallback != null) {
      throw new AssertionError("DatabaseLauncher has already started. Create a new instance in order to launch a new version.");
    }
    mCallback = callback;
    mLaunchedUpdate = getLaunchableUpdate(database, context);

    if (mLaunchedUpdate == null) {
      mCallback.onFailure(new Exception("No launchable update was found"));
      return;
    }

    if (mLaunchedUpdate.status == UpdateStatus.EMBEDDED) {
      mBundleAssetName = EmbeddedLoader.BARE_BUNDLE_FILENAME;
      if (mLocalAssetFiles != null) {
        throw new AssertionError("mLocalAssetFiles should be null for embedded updates");
      }
      mCallback.onSuccess();
      return;
    }

    // verify that we have all assets on disk
    // according to the database, we should, but something could have gone wrong on disk

    AssetEntity launchAsset = database.updateDao().loadLaunchAsset(mLaunchedUpdate.id);
    if (launchAsset.relativePath == null) {
      throw new AssertionError("Launch Asset relativePath should not be null");
    }

    File launchAssetFile = ensureAssetExists(launchAsset, database, context);
    if (launchAssetFile != null) {
      mLaunchAssetFile = launchAssetFile.toString();
    }

    List<AssetEntity> assetEntities = database.assetDao().loadAssetsForUpdate(mLaunchedUpdate.id);
    mLocalAssetFiles = new HashMap<>();
    for (AssetEntity asset : assetEntities) {
      String filename = asset.relativePath;
      if (filename != null) {
        File assetFile = ensureAssetExists(asset, database, context);
        if (assetFile != null) {
          mLocalAssetFiles.put(
              asset,
              assetFile.toURI().toString()
          );
        }
      }
    }

    if (mAssetsToDownload == 0) {
      if (mLaunchAssetFile == null) {
        mCallback.onFailure(new Exception("mLaunchAssetFile was immediately null; this should never happen"));
      } else {
        mCallback.onSuccess();
      }
    }
  }

  public UpdateEntity getLaunchableUpdate(UpdatesDatabase database, Context context) {
    List<UpdateEntity> launchableUpdates = database.updateDao().loadLaunchableUpdates();

    // We can only run an update marked as embedded if it's actually the update embedded in the
    // current binary. We might have an older update from a previous binary still listed as
    // "EMBEDDED" in the database so we need to do this check.
    Manifest embeddedManifest = EmbeddedLoader.readEmbeddedManifest(context);
    ArrayList<UpdateEntity> filteredLaunchableUpdates = new ArrayList<>();
    for (UpdateEntity update : launchableUpdates) {
      if (update.status == UpdateStatus.EMBEDDED) {
        if (!embeddedManifest.getUpdateEntity().id.equals(update.id)) {
          continue;
        }
      }
      filteredLaunchableUpdates.add(update);
    }

    return mSelectionPolicy.selectUpdateToLaunch(filteredLaunchableUpdates);
  }

  private File ensureAssetExists(AssetEntity asset, UpdatesDatabase database, Context context) {
    File assetFile = new File(mUpdatesDirectory, asset.relativePath);
    boolean assetFileExists = assetFile.exists();
    if (!assetFileExists) {
      // something has gone wrong, we're missing this asset
      // first we check to see if a copy is embedded in the binary
      Manifest embeddedManifest = EmbeddedLoader.readEmbeddedManifest(context);
      if (embeddedManifest != null) {
        ArrayList<AssetEntity> embeddedAssets = embeddedManifest.getAssetEntityList();
        AssetEntity matchingEmbeddedAsset = null;
        for (AssetEntity embeddedAsset : embeddedAssets) {
          if (embeddedAsset.key.equals(asset.key)) {
            matchingEmbeddedAsset = embeddedAsset;
            break;
          }
        }

        if (matchingEmbeddedAsset != null) {
          try {
            byte[] hash = EmbeddedLoader.copyAssetAndGetHash(matchingEmbeddedAsset, assetFile, context);
            if (hash != null && Arrays.equals(hash, asset.hash)) {
              assetFileExists = true;
            }
          } catch (Exception e) {
            // things are really not going our way...
            Log.e(TAG, "Failed to copy matching embedded asset", e);
          }
        }
      }
    }

    if (!assetFileExists) {
      // we still don't have the asset locally, so try downloading it remotely
      mAssetsToDownload++;
      FileDownloader.downloadAsset(asset, mUpdatesDirectory, context, new FileDownloader.AssetDownloadCallback() {
        @Override
        public void onFailure(Exception e, AssetEntity assetEntity) {
          Log.e(TAG, "Failed to load asset from disk or network", e);
          if (assetEntity.isLaunchAsset) {
            mLaunchAssetException = e;
          }
          maybeFinish(assetEntity, null);
        }

        @Override
        public void onSuccess(AssetEntity assetEntity, boolean isNew) {
          database.assetDao().updateAsset(assetEntity);
          File assetFile = new File(mUpdatesDirectory, assetEntity.relativePath);
          maybeFinish(assetEntity, assetFile.exists() ? assetFile : null);
        }
      });
      return null;
    } else {
      return assetFile;
    }
  }

  private synchronized void maybeFinish(AssetEntity asset, File assetFile) {
    mAssetsToDownloadFinished++;
    if (asset.isLaunchAsset) {
      if (assetFile == null) {
        Log.e(TAG, "Could not launch; failed to load update from disk or network");
        mLaunchAssetFile = null;
      } else {
        mLaunchAssetFile = assetFile.toString();
      }
    } else {
      if (assetFile != null) {
        mLocalAssetFiles.put(
            asset,
            assetFile.toString()
        );
      }
    }

    if (mAssetsToDownloadFinished == mAssetsToDownload) {
      if (mLaunchAssetFile == null) {
        if (mLaunchAssetException == null) {
          mLaunchAssetException = new Exception("Launcher mLaunchAssetFile is unexpectedly null");
        }
        mCallback.onFailure(mLaunchAssetException);
      } else {
        mCallback.onSuccess();
      }
    }
  }
}
