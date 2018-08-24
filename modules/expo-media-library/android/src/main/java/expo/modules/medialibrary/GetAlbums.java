package expo.modules.medialibrary;

import android.content.Context;
import android.database.Cursor;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.MediaStore;

import java.util.ArrayList;
import java.util.List;

import expo.core.Promise;

import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION;
import static expo.modules.medialibrary.MediaLibraryConstants.EXTERNAL_CONTENT;

class GetAlbums extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final Promise mPromise;

  public GetAlbums(Context context, Promise promise) {
    mContext = context;
    mPromise = promise;
  }

  @Override
  protected Void doInBackground(Void... params) {
    List result = new ArrayList();
    final String countColumn = "COUNT(*)";
    final String[] projection = {MediaStore.Images.Media.BUCKET_ID, MediaStore.Images.Media.BUCKET_DISPLAY_NAME, countColumn};
    final String selection = MediaStore.Files.FileColumns.MEDIA_TYPE + " != " + MediaStore.Files.FileColumns.MEDIA_TYPE_NONE + ") /*";

    try (Cursor albums = mContext.getContentResolver().query(
        EXTERNAL_CONTENT,
        projection,
        selection,
        null,
        "*/ GROUP BY " + MediaStore.Images.Media.BUCKET_ID +
            " ORDER BY " + MediaStore.Images.Media.BUCKET_DISPLAY_NAME)) {

      if (albums == null) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get albums. Query returns null.");
      } else {
        final int bucketIdIndex = albums.getColumnIndex(MediaStore.Images.Media.BUCKET_ID);
        final int bucketDisplayNameIndex = albums.getColumnIndex(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);
        final int numOfItemsIndex = albums.getColumnIndex(countColumn);

        while (albums.moveToNext()) {
          Bundle album = new Bundle();
          album.putString("id", albums.getString(bucketIdIndex));
          album.putString("title", albums.getString(bucketDisplayNameIndex));
          album.putParcelable("type", null);
          album.putInt("assetCount", albums.getInt(numOfItemsIndex));
          result.add(album);
        }
        mPromise.resolve(result);
      }
    } catch (SecurityException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
          "Could not get albums: need READ_EXTERNAL_STORAGE permission.", e);
    }
    return null;
  }
}
