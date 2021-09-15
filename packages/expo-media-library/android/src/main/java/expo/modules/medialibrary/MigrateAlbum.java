package expo.modules.medialibrary;

import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.os.AsyncTask;
import android.os.Build;
import android.provider.MediaStore;

import expo.modules.core.Promise;

import java.io.File;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import androidx.annotation.RequiresApi;

import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_MIGRATE;
import static expo.modules.medialibrary.MediaLibraryUtils.getRelativePathForAssetType;
import static expo.modules.medialibrary.MediaLibraryUtils.mineTypeToExternalUri;

@RequiresApi(Build.VERSION_CODES.R)
public class MigrateAlbum extends AsyncTask<Void, Void, Void> {

  private final Context mContext;
  private final List<MediaLibraryUtils.AssetFile> mAssets;
  private final String mAlbumDirName;
  private final Promise mPromise;

  public MigrateAlbum(Context context, List<MediaLibraryUtils.AssetFile> assets, String albumDirName, Promise promise) {
    mContext = context;
    mAssets = assets;
    mAlbumDirName = albumDirName;
    mPromise = promise;
  }

  @Override
  protected Void doInBackground(Void... voids) {
    // Previously, users were able to save different assets type in the same directory.
    // But now, it's not always possible.
    // If album contains movies or pictures, we can move it to Environment.DIRECTORY_PICTURES.
    // Otherwise, we reject.
    Set<String> assetsRelativePaths = mAssets
      .stream()
      .map(asset -> getRelativePathForAssetType(asset.getMimeType(), false))
      .collect(Collectors.toSet());

    if (assetsRelativePaths.size() > 1) {
      mPromise.reject(ERROR_UNABLE_TO_MIGRATE, "The album contains incompatible file types.");
      return null;
    }

    String relativePath = assetsRelativePaths.iterator().next() + File.separator + mAlbumDirName;

    ContentValues values = new ContentValues();
    values.put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath);
    mAssets.forEach(asset ->
      mContext
        .getContentResolver()
        .update(
          ContentUris.withAppendedId(mineTypeToExternalUri(asset.getMimeType()), Long.parseLong(asset.getAssetId())),
          values,
          null
        ));

    mPromise.resolve(null);
    return null;
  }
}
