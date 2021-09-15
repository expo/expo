package abi42_0_0.expo.modules.medialibrary;

import android.content.Context;
import android.media.MediaScannerConnection;
import android.os.AsyncTask;
import android.provider.MediaStore;

import abi42_0_0.org.unimodules.core.Promise;

import java.io.File;
import java.io.IOException;
import java.util.List;

import static abi42_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_ALBUM;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_SAVE;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryUtils.FileStrategy;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryUtils.copyStrategy;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryUtils.getAssetsById;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryUtils.getEnvDirectoryForAssetType;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryUtils.moveStrategy;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryUtils.queryAlbum;

class CreateAlbum extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final Promise mPromise;
  private final String mAlbumName;
  private final String mAssetId;
  private final FileStrategy mStrategy;

  public CreateAlbum(Context context, String albumName, String assetId, boolean copyAsset, Promise promise) {
    mContext = context;
    mAlbumName = albumName;
    mAssetId = assetId;
    mPromise = promise;
    mStrategy = copyAsset ? copyStrategy : moveStrategy;
  }

  private File createAlbum(String mimeType) {
    File albumDir = getEnvDirectoryForAssetType(mimeType, false);
    if (albumDir == null) {
      mPromise.reject(ERROR_NO_ALBUM, "Could not guess asset type.");
      return null;
    }

    File album = new File(albumDir.getPath(), mAlbumName);
    if (!album.exists() && !album.mkdirs()) {
      mPromise.reject(ERROR_NO_ALBUM, "Could not create album directory.");
      return null;
    }
    return album;
  }

  @Override
  protected Void doInBackground(Void... params) {
    try {
      List<MediaLibraryUtils.AssetFile> files = getAssetsById(mContext, mPromise, mAssetId);
      if (files == null) {
        return null;
      }

      MediaLibraryUtils.AssetFile albumCreator = files.get(0);
      File album = createAlbum(albumCreator.getMimeType());
      if (album == null) {
        return null;
      }

      File newFile = mStrategy.apply(albumCreator, album, mContext);

      MediaScannerConnection.scanFile(
        mContext,
        new String[]{newFile.getPath()},
        null,
        (path, uri) -> {
          if (uri == null) {
            mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not add image to album.");
            return;
          }
          final String selection = MediaStore.Images.Media.DATA + "=?";
          final String[] args = {path};
          queryAlbum(mContext, selection, args, mPromise);
        });
    } catch (SecurityException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not create album: need WRITE_EXTERNAL_STORAGE permission.", e);
    } catch (IOException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not read file or parse EXIF tags", e);
    }
    return null;
  }
}
