package expo.modules.updates.loader;

import android.content.Context;
import android.util.Log;

import expo.modules.updates.db.enums.UpdateStatus;
import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.manifest.Manifest;
import expo.modules.updates.manifest.ManifestFactory;

import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Date;

public class EmbeddedLoader {

  private static final String TAG = EmbeddedLoader.class.getSimpleName();

  public static final String MANIFEST_FILENAME = "app.manifest";
  public static final String BUNDLE_FILENAME = "app.bundle";
  public static final String BARE_BUNDLE_FILENAME = "index.android.bundle";

  private static Manifest sEmbeddedManifest = null;

  private Context mContext;
  private UpdatesDatabase mDatabase;
  private File mUpdatesDirectory;

  private UpdateEntity mUpdateEntity;
  private ArrayList<AssetEntity> mErroredAssetList = new ArrayList<>();
  private ArrayList<AssetEntity> mExistingAssetList = new ArrayList<>();
  private ArrayList<AssetEntity> mFinishedAssetList = new ArrayList<>();

  public EmbeddedLoader(Context context, UpdatesDatabase database, File updatesDirectory) {
    mContext = context;
    mDatabase = database;
    mUpdatesDirectory = updatesDirectory;
  }

  public boolean loadEmbeddedUpdate() {
    boolean success = false;
    Manifest manifest = readEmbeddedManifest(mContext);
    if (manifest != null) {
      success = processManifest(manifest);
      reset();
    }
    return success;
  }

  public void reset() {
    mUpdateEntity = null;
    mErroredAssetList = new ArrayList<>();
    mExistingAssetList = new ArrayList<>();
    mFinishedAssetList = new ArrayList<>();
  }

  public static Manifest readEmbeddedManifest(Context context) {
    if (sEmbeddedManifest == null) {
      try (InputStream stream = context.getAssets().open(MANIFEST_FILENAME)) {
        String manifestString = IOUtils.toString(stream, "UTF-8");
        sEmbeddedManifest = ManifestFactory.getEmbeddedManifest(context, new JSONObject(manifestString));
      } catch (Exception e) {
        Log.e(TAG, "Could not read embedded manifest", e);
        throw new AssertionError("The embedded manifest is invalid or could not be read. Make sure you have created app.manifest and app.bundle files and added them to the `assets` folder. If you are using Expo CLI, make sure you have run `expo publish` or `expo export` at least once. More information at https://expo.fyi/embedded-assets");
      }
    }

    return sEmbeddedManifest;
  }

  public static byte[] copyAssetAndGetHash(AssetEntity asset, File destination, Context context) throws NoSuchAlgorithmException, IOException {
    try (
        InputStream inputStream = context.getAssets().open(asset.embeddedAssetFilename)
    ) {
      return UpdatesUtils.sha256AndWriteToFile(inputStream, destination);
    } catch (Exception e) {
      Log.e(TAG, "Failed to copy asset " + asset.embeddedAssetFilename, e);
      throw e;
    }
  }

  // private helper methods

  private boolean processManifest(Manifest manifest) {
    UpdateEntity newUpdateEntity = manifest.getUpdateEntity();
    UpdateEntity existingUpdateEntity = mDatabase.updateDao().loadUpdateWithId(newUpdateEntity.id);
    if (existingUpdateEntity != null && existingUpdateEntity.status == UpdateStatus.READY) {
      // hooray, we already have this update downloaded and ready to go!
      mUpdateEntity = existingUpdateEntity;
      return true;
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
      copyAllAssets(manifest.getAssetEntityList());
      return true;
    }
  }

  private void copyAllAssets(ArrayList<AssetEntity> assetList) {
    for (AssetEntity asset : assetList) {
      AssetEntity matchingDbEntry = mDatabase.assetDao().loadAssetWithPackagerKey(asset.packagerKey);
      if (matchingDbEntry != null) {
        mDatabase.assetDao().mergeAndUpdateAsset(matchingDbEntry, asset);
        asset = matchingDbEntry;
      }

      // if we already have a local copy of this asset, don't try to download it again!
      if (asset.relativePath != null && new File(mUpdatesDirectory, asset.relativePath).exists()) {
        mExistingAssetList.add(asset);
        continue;
      }

      String filename = UpdatesUtils.createFilenameForAsset(asset);
      File destination = new File(mUpdatesDirectory, filename);

      if (destination.exists()) {
        asset.relativePath = filename;
        mExistingAssetList.add(asset);
      } else {
        try {
          asset.hash = copyAssetAndGetHash(asset, destination, mContext);
          asset.downloadTime = new Date();
          asset.relativePath = filename;
          mFinishedAssetList.add(asset);
        } catch (FileNotFoundException e) {
          throw new AssertionError("APK bundle must contain the expected embedded asset " + asset.embeddedAssetFilename);
        } catch (Exception e) {
          mErroredAssetList.add(asset);
        }
      }
    }

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
    // TODO: maybe try downloading failed assets in background
  }
}
