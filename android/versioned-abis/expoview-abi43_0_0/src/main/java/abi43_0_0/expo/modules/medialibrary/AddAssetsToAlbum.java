package abi43_0_0.expo.modules.medialibrary;

import android.content.Context;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.os.AsyncTask;
import android.os.Build;
import android.provider.MediaStore;

import abi43_0_0.expo.modules.core.Promise;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static abi43_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_IO_EXCEPTION;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_MEDIA_LIBRARY_CORRUPTED;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_ALBUM;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_PERMISSIONS;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_SAVE_PERMISSION;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryConstants.EXTERNAL_CONTENT;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryUtils.FileStrategy;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryUtils.copyStrategy;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryUtils.getAssetsById;
import static abi43_0_0.expo.modules.medialibrary.MediaLibraryUtils.moveStrategy;

class AddAssetsToAlbum extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final String[] mAssetsId;
  private final String mAlbumId;
  private final FileStrategy mStrategy;
  private final Promise mPromise;

  AddAssetsToAlbum(Context context, String[] assetsId, String albumId, boolean copyToAlbum, Promise promise) {
    mContext = context;
    mAssetsId = assetsId;
    mAlbumId = albumId;
    mPromise = promise;
    mStrategy = copyToAlbum ? copyStrategy : moveStrategy;
  }

  private File getAlbum() {
    final String[] path = {MediaStore.MediaColumns.DATA};
    final String selection = MediaStore.MediaColumns.BUCKET_ID + "=?";
    final String[] id = {mAlbumId};

    try (Cursor album = mContext.getContentResolver().query(
      EXTERNAL_CONTENT,
      path,
      selection,
      id,
      null)) {

      if (album == null) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get album. Query returns null.");
        return null;
      } else if (album.getCount() == 0) {
        mPromise.reject(ERROR_NO_ALBUM, "No album with id: " + mAlbumId);
        return null;
      }
      album.moveToNext();
      File fileInAlbum = new File(album.getString(album.getColumnIndex(MediaStore.Images.Media.DATA)));

      // Media store table can be corrupted. Extra check won't harm anyone.
      if (!fileInAlbum.isFile()) {
        mPromise.reject(ERROR_MEDIA_LIBRARY_CORRUPTED, "Media library is corrupted");
        return null;
      }

      return new File(fileInAlbum.getParent());
    }
  }

  @Override
  protected Void doInBackground(Void... params) {
    try {
      List<MediaLibraryUtils.AssetFile> assets = getAssetsById(mContext, mPromise, mAssetsId);
      if (assets == null) {
        return null;
      }

      File album = getAlbum();
      if (album == null) {
        return null;
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !album.canWrite()) {
        mPromise.reject(ERROR_NO_PERMISSIONS, "The application doesn't have permission to write to the album's directory. For more information, check out https://expo.fyi/android-r.");
        return null;
      }

      List<String> paths = new ArrayList<>();
      for (MediaLibraryUtils.AssetFile asset : assets) {
        File newAsset = mStrategy.apply(asset, album, mContext);
        paths.add(newAsset.getPath());
      }

      final AtomicInteger atomicInteger = new AtomicInteger(paths.size());
      MediaScannerConnection.scanFile(mContext, paths.toArray(new String[0]), null, (path, uri) -> {
        if (atomicInteger.decrementAndGet() == 0) {
          mPromise.resolve(true);
        }
      });
    } catch (SecurityException e) {
      mPromise.reject(ERROR_UNABLE_TO_SAVE_PERMISSION, "Could not get albums: need WRITE_EXTERNAL_STORAGE permission.", e);
    } catch (IOException e) {
      mPromise.reject(ERROR_IO_EXCEPTION, "Unable to read or save data", e);
    }
    return null;
  }
}
