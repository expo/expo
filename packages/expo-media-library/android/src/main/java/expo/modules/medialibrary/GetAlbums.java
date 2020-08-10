package expo.modules.medialibrary;

import android.content.Context;
import android.database.Cursor;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.MediaStore;

import org.unimodules.core.Promise;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    final String[] projection = {MediaStore.Images.Media.BUCKET_ID, MediaStore.Images.Media.BUCKET_DISPLAY_NAME};
    final String selection = MediaStore.Files.FileColumns.MEDIA_TYPE + " != " + MediaStore.Files.FileColumns.MEDIA_TYPE_NONE;

    Map<String, Album> albums = new HashMap<>();

    try (Cursor asset = mContext.getContentResolver().query(
        EXTERNAL_CONTENT,
        projection,
        selection,
        null,
        MediaStore.Images.Media.BUCKET_DISPLAY_NAME)) {

      if (asset == null) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get albums. Query returns null.");
      } else {
        final int bucketIdIndex = asset.getColumnIndex(MediaStore.Images.Media.BUCKET_ID);
        final int bucketDisplayNameIndex = asset.getColumnIndex(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);

        while (asset.moveToNext()) {
          final String id = asset.getString(bucketIdIndex);
          if (!albums.containsKey(id)) {
            final String title = asset.getString(bucketDisplayNameIndex);
            albums.put(id, new Album(id, title));
          } else {
            albums.get(id).incrementCount();
          }
        }

        List<Bundle> result = albums.values().stream().map(Album::toBundle).collect(Collectors.toList());
        mPromise.resolve(result);
      }
    } catch (SecurityException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get albums: need READ_EXTERNAL_STORAGE permission.", e);
    } catch (IllegalArgumentException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get albums.", e);
    }
    return null;
  }

  private class Album {
    private String id;
    private String title;
    private int count;

    Album(String id, String title) {
      this.id = id;
      this.title = title;
      this.count = 1;
    }

    void incrementCount() {
      this.count++;
    }

    Bundle toBundle() {
      Bundle album = new Bundle();
      album.putString("id", this.id);
      album.putString("title", this.title);
      album.putParcelable("type", null);
      album.putInt("assetCount", this.count);
      return album;
    }
  }
}
