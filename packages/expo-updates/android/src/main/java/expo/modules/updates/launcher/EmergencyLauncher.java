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
import expo.modules.updates.manifest.Manifest;

import static expo.modules.updates.loader.EmbeddedLoader.BUNDLE_FILENAME;

public class EmergencyLauncher implements Launcher {

  private static final String TAG = EmergencyLauncher.class.getSimpleName();

  private static final String ERROR_LOG_FILENAME = "expo-error.log";

  private Map<AssetEntity, String> mLocalAssetFiles;

  public EmergencyLauncher(final Context context, final Exception fatalException) {
    Manifest embeddedManifest = EmbeddedLoader.readEmbeddedManifest(context);
    mLocalAssetFiles = new HashMap<>();
    for (AssetEntity asset : embeddedManifest.getAssetEntityList()) {
      mLocalAssetFiles.put(
        asset,
        "asset:///" + asset.embeddedAssetFilename
      );
    }

    AsyncTask.execute(() -> {
      writeErrorToLog(context, fatalException);
    });
  }

  public @Nullable UpdateEntity getLaunchedUpdate() {
    return null;
  }

  public @Nullable String getLaunchAssetFile() {
    return null;
  }

  public @Nullable String getBundleAssetName() {
    return BUNDLE_FILENAME;
  }

  public @Nullable Map<AssetEntity, String> getLocalAssetFiles() {
    return mLocalAssetFiles;
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
