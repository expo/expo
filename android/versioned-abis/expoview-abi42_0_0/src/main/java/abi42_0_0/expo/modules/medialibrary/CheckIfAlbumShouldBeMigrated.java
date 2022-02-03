package abi42_0_0.expo.modules.medialibrary;

import android.content.Context;
import android.os.AsyncTask;
import android.os.Build;

import abi42_0_0.org.unimodules.core.Promise;

import java.io.File;

import androidx.annotation.RequiresApi;

import static abi42_0_0.expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_ALBUM;
import static abi42_0_0.expo.modules.medialibrary.MediaLibraryUtils.getAlbumFile;

@RequiresApi(Build.VERSION_CODES.R)
public class CheckIfAlbumShouldBeMigrated extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final String mAlbumId;
  private final Promise mPromise;

  public CheckIfAlbumShouldBeMigrated(Context context, String albumId, Promise promise) {
    mContext = context;
    mAlbumId = albumId;
    mPromise = promise;
  }

  @Override
  protected Void doInBackground(Void... voids) {
    File albumDir = getAlbumFile(mContext, mAlbumId);
    if (albumDir == null) {
      mPromise.reject(ERROR_NO_ALBUM, "Couldn't find album");
      return null;
    }

    mPromise.resolve(!albumDir.canWrite());
    return null;
  }
}
