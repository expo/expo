package expo.modules.updates.loader;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.security.NoSuchAlgorithmException;

import expo.modules.updates.UpdatesUtils;
import expo.modules.updates.db.entity.AssetEntity;

/**
 * Utility class for Loader and its subclasses, to allow for easy mocking
 */
public class LoaderFiles {

  private static final String TAG = LoaderFiles.class.getSimpleName();

  public boolean fileExists(File destination) {
    return destination.exists();
  }

  public byte[] copyAssetAndGetHash(AssetEntity asset, File destination, Context context) throws NoSuchAlgorithmException, IOException {
    if (asset.embeddedAssetFilename != null) {
      return copyContextAssetAndGetHash(asset, destination, context);
    } else if (asset.resourcesFilename != null && asset.resourcesFolder != null) {
      return copyResourceAndGetHash(asset, destination, context);
    } else {
      throw new AssertionError("Failed to copy embedded asset " + asset.key + " from APK assets or resources because not enough information was provided.");
    }
  }

  private byte[] copyContextAssetAndGetHash(AssetEntity asset, File destination, Context context) throws NoSuchAlgorithmException, IOException {
    try (
      InputStream inputStream = context.getAssets().open(asset.embeddedAssetFilename)
    ) {
      return UpdatesUtils.sha256AndWriteToFile(inputStream, destination);
    } catch (Exception e) {
      Log.e(TAG, "Failed to copy asset " + asset.embeddedAssetFilename, e);
      throw e;
    }
  }

  private byte[] copyResourceAndGetHash(AssetEntity asset, File destination, Context context) throws NoSuchAlgorithmException, IOException {
    int id = context.getResources().getIdentifier(asset.resourcesFilename, asset.resourcesFolder, context.getPackageName());
    try (
      InputStream inputStream = context.getResources().openRawResource(id)
    ) {
      return UpdatesUtils.sha256AndWriteToFile(inputStream, destination);
    } catch (Exception e) {
      Log.e(TAG, "Failed to copy asset " + asset.embeddedAssetFilename, e);
      throw e;
    }
  }
}
