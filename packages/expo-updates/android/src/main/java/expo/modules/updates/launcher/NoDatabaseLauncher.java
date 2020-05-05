package expo.modules.updates.launcher;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import androidx.annotation.Nullable;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.loader.EmbeddedLoader;
import expo.modules.updates.manifest.BareManifest;
import expo.modules.updates.manifest.Manifest;

public class NoDatabaseLauncher implements Launcher {

  private static final String TAG = NoDatabaseLauncher.class.getSimpleName();

  private static final String ERROR_LOG_FILENAME = "expo-error.log";

  private String mBundleAssetName;
  private Map<AssetEntity, String> mLocalAssetFiles;

  public NoDatabaseLauncher(Context context) {
    this(context, null);
  }

  public NoDatabaseLauncher(final Context context, final @Nullable Exception fatalException) {
    Manifest embeddedManifest = EmbeddedLoader.readEmbeddedManifest(context);
    if (embeddedManifest instanceof BareManifest) {
      mBundleAssetName = EmbeddedLoader.BARE_BUNDLE_FILENAME;
      mLocalAssetFiles = null;
    } else {
      mBundleAssetName = EmbeddedLoader.BUNDLE_FILENAME;
      mLocalAssetFiles = new HashMap<>();
      for (AssetEntity asset : embeddedManifest.getAssetEntityList()) {
        mLocalAssetFiles.put(
          asset,
          "asset:///" + asset.embeddedAssetFilename
        );
      }
    }

    if (fatalException != null) {
      AsyncTask.execute(() -> {
        writeErrorToLog(context, fatalException);
      });
    }
  }

  public @Nullable UpdateEntity getLaunchedUpdate() {
    return null;
  }

  public @Nullable String getLaunchAssetFile() {
    return null;
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

  private void writeErrorToLog(Context context, Exception fatalException) {
    try {
      File errorLogFile = new File(context.getFilesDir(), ERROR_LOG_FILENAME);
      String exceptionString = fatalException.toString();
      FileUtils.writeStringToFile(errorLogFile, exceptionString, "UTF-8", true);
    } catch (Exception e) {
      Log.e(TAG, "Failed to write fatal error to log", e);
    }
  }

  public static @Nullable String consumeErrorLog(Context context) {
    try {
      File errorLogFile = new File(context.getFilesDir(), ERROR_LOG_FILENAME);
      if (!errorLogFile.exists()) {
        return null;
      }
      String logContents = FileUtils.readFileToString(errorLogFile, "UTF-8");
      errorLogFile.delete();
      return logContents;
    } catch (Exception e) {
      Log.e(TAG, "Failed to read error log", e);
      return null;
    }
  }
}
