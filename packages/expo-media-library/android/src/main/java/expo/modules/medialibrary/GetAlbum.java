package expo.modules.medialibrary;

import android.content.Context;
import android.os.AsyncTask;
import android.provider.MediaStore;

import expo.core.Promise;

import static expo.modules.medialibrary.MediaLibraryUtils.queryAlbum;

class GetAlbum extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final Promise mPromise;
  private final String mAlbumName;

  public GetAlbum(Context context, String albumName, Promise promise) {
    mContext = context;
    mPromise = promise;
    mAlbumName = albumName;
  }

  @Override
  protected Void doInBackground(Void... params) {
    final String selection = MediaStore.Files.FileColumns.MEDIA_TYPE + " != " + MediaStore.Files.FileColumns.MEDIA_TYPE_NONE +
        " AND " + MediaStore.Images.Media.BUCKET_DISPLAY_NAME + "=?) /*";
    final String[] selectionArgs = new String[]{mAlbumName};

    queryAlbum(mContext, selection, selectionArgs, mPromise);
    return null;
  }
}
