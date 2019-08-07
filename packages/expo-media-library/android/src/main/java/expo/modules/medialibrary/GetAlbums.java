package expo.modules.medialibrary;

import android.content.Context;
import android.database.Cursor;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.MediaStore;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.unimodules.core.Promise;

import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION;
import static expo.modules.medialibrary.MediaLibraryConstants.EXTERNAL_CONTENT;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_ALL;
import static expo.modules.medialibrary.MediaLibraryUtils.convertMediaType;

class GetAlbums extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final Promise mPromise;
  private final Map<String, Object> mAlbumOptions;

  public GetAlbums(Context context, Map<String, Object> assetOptions, Promise promise) {
    mContext = context;
    mPromise = promise;
    mAlbumOptions = assetOptions;
  }

  @Override
  protected Void doInBackground(Void... params) {
    List<Object> mediaType = mAlbumOptions.containsKey("mediaType") ? (List<Object>) mAlbumOptions.get("mediaType") : null;

    StringBuilder mSelection = new StringBuilder();
    if (mediaType != null && !mediaType.contains(MEDIA_TYPE_ALL)) {
      List<Integer> mediaTypeInts = new ArrayList<Integer>();

      for (Object mediaTypeStr : mediaType) {
        mediaTypeInts.add(convertMediaType(mediaTypeStr.toString()));
      }
      mSelection.append(MediaStore.Files.FileColumns.MEDIA_TYPE).append(" IN (").append(TextUtils.join(",", mediaTypeInts)).append(")");
    } else {
      mSelection.append(MediaStore.Files.FileColumns.MEDIA_TYPE).append(" != ").append(MediaStore.Files.FileColumns.MEDIA_TYPE_NONE);
    }
    mSelection.append(") /*");

    List result = new ArrayList();
    final String countColumn = "COUNT(*)";
    final String[] projection = {MediaStore.Images.Media.BUCKET_ID, MediaStore.Images.Media.BUCKET_DISPLAY_NAME, countColumn};
    final String selection = mSelection.toString();

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
