package expo.modules.updates.loader;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.Nullable;
import expo.modules.updates.UpdatesController;
import expo.modules.updates.db.enums.UpdateStatus;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.manifest.Manifest;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;

public class RemoteLoader {

  private static String TAG = RemoteLoader.class.getSimpleName();

  private Context mContext;
  private UpdatesDatabase mDatabase;
  private File mUpdatesDirectory;

  private UpdateEntity mUpdateEntity;
  private LoaderCallback mCallback;
  private int mAssetTotal = 0;
  private ArrayList<AssetEntity> mErroredAssetList = new ArrayList<>();
  private ArrayList<AssetEntity> mExistingAssetList = new ArrayList<>();
  private ArrayList<AssetEntity> mFinishedAssetList = new ArrayList<>();

  public interface LoaderCallback {
    void onFailure(Exception e);
    void onSuccess(@Nullable UpdateEntity update);
  }

  public RemoteLoader(Context context, UpdatesDatabase database, File updatesDirectory) {
    mContext = context;
    mDatabase = database;
    mUpdatesDirectory = updatesDirectory;
  }

  // lifecycle methods for class

  public void start(Uri url, LoaderCallback callback) {
    if (mCallback != null) {
      callback.onFailure(new Exception("RemoteLoader has already started. Create a new instance in order to load multiple URLs in parallel."));
      return;
    }

    mCallback = callback;

    FileDownloader.downloadManifest(url, mContext, new FileDownloader.ManifestDownloadCallback() {
      @Override
      public void onFailure(String message, Exception e) {
        finishWithError(message, e);
      }

      @Override
      public void onSuccess(Manifest manifest) {
        boolean shouldContinue = UpdatesController.getInstance().getSelectionPolicy().shouldLoadNewUpdate(
          manifest.getUpdateEntity(),
          UpdatesController.getInstance().getLaunchedUpdate()
        );
        if (shouldContinue) {
          processManifest(manifest);
        } else {
          mCallback.onSuccess(null);
        }
      }
    });
  }

  private void reset() {
    mUpdateEntity = null;
    mCallback = null;
    mAssetTotal = 0;
    mErroredAssetList = new ArrayList<>();
    mExistingAssetList = new ArrayList<>();
    mFinishedAssetList = new ArrayList<>();
  }

  private void finishWithSuccess() {
    if (mCallback == null) {
      Log.e(TAG, "RemoteLoader tried to finish but it already finished or was never initialized.");
      return;
    }

    mCallback.onSuccess(mUpdateEntity);
    reset();
  }

  private void finishWithError(String message, Exception e) {
    Log.e(TAG, message, e);

    if (mCallback == null) {
      Log.e(TAG, "RemoteLoader tried to finish but it already finished or was never initialized.");
      return;
    }

    mCallback.onFailure(e);
    reset();
  }

  // private helper methods

  private void processManifest(Manifest manifest) {
    UpdateEntity newUpdateEntity = manifest.getUpdateEntity();
    UpdateEntity existingUpdateEntity = mDatabase.updateDao().loadUpdateWithId(newUpdateEntity.id);
    if (existingUpdateEntity != null && existingUpdateEntity.status == UpdateStatus.READY) {
      // hooray, we already have this update downloaded and ready to go!
      mUpdateEntity = existingUpdateEntity;
      finishWithSuccess();
    } else {
      if (existingUpdateEntity == null) {
        // no update already exists with this ID, so we need to insert it and download everything.
        mUpdateEntity = newUpdateEntity;
        mDatabase.updateDao().insertUpdate(mUpdateEntity);
      } else {
        // we've already partially downloaded the update, so we should use the existing entity.
        // however, it's not ready, so we should try to download all the assets again.
        mUpdateEntity = existingUpdateEntity;
      }
      downloadAllAssets(manifest.getAssetEntityList());
    }
  }

  private void downloadAllAssets(ArrayList<AssetEntity> assetList) {
    mAssetTotal = assetList.size();
    for (AssetEntity assetEntity : assetList) {
      AssetEntity matchingDbEntry = mDatabase.assetDao().loadAssetWithPackagerKey(assetEntity.packagerKey);
      if (matchingDbEntry != null) {
        mDatabase.assetDao().mergeAndUpdateAsset(matchingDbEntry, assetEntity);
        assetEntity = matchingDbEntry;
      }

      // if we already have a local copy of this asset, don't try to download it again!
      if (assetEntity.relativePath != null && new File(mUpdatesDirectory, assetEntity.relativePath).exists()) {
        handleAssetDownloadCompleted(assetEntity, true, false);
        continue;
      }

      if (assetEntity.url == null) {
        Log.e(TAG, "Failed to download asset with no URL provided");
        handleAssetDownloadCompleted(assetEntity, false, false);
        continue;
      }

      FileDownloader.downloadAsset(assetEntity, mUpdatesDirectory, mContext, new FileDownloader.AssetDownloadCallback() {
        @Override
        public void onFailure(Exception e, AssetEntity assetEntity) {
          Log.e(TAG, "Failed to download asset from " + assetEntity.url, e);
          handleAssetDownloadCompleted(assetEntity, false, false);
        }

        @Override
        public void onSuccess(AssetEntity assetEntity, boolean isNew) {
          handleAssetDownloadCompleted(assetEntity, true, isNew);
        }
      });
    }
  }

  private synchronized void handleAssetDownloadCompleted(AssetEntity assetEntity, boolean success, boolean isNew) {
    if (success) {
      if (isNew) {
        mFinishedAssetList.add(assetEntity);
      } else {
        mExistingAssetList.add(assetEntity);
      }
    } else {
      mErroredAssetList.add(assetEntity);
    }

    if (mFinishedAssetList.size() + mErroredAssetList.size() + mExistingAssetList.size() == mAssetTotal) {
      try {
        for (AssetEntity asset : mExistingAssetList) {
          boolean existingAssetFound = mDatabase.assetDao().addExistingAssetToUpdate(mUpdateEntity, asset, asset.isLaunchAsset);
          if (!existingAssetFound) {
            // the database and filesystem have gotten out of sync
            // do our best to create a new entry for this file even though it already existed on disk
            byte[] hash = null;
            try {
              hash = UpdatesUtils.sha256(new File(mUpdatesDirectory, asset.relativePath));
            } catch (Exception e) {
            }
            asset.downloadTime = new Date();
            asset.hash = hash;
            mFinishedAssetList.add(asset);
          }
        }
        mDatabase.assetDao().insertAssets(mFinishedAssetList, mUpdateEntity);
        if (mErroredAssetList.size() == 0) {
          mDatabase.updateDao().markUpdateFinished(mUpdateEntity);
        }
      } catch (Exception e) {
        finishWithError("Error while adding new update to database", e);
        return;
      }

      if (mErroredAssetList.size() > 0) {
        finishWithError("Failed to load all assets", new Exception("Failed to load all assets"));
      } else {
        finishWithSuccess();
      }
    }
  }
}
