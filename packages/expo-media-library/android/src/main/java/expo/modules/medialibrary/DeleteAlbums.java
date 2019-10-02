package expo.modules.medialibrary;

import android.content.Context;
import android.os.AsyncTask;
import android.provider.MediaStore.Images.Media;

import java.util.List;

import org.unimodules.core.Promise;
import static expo.modules.medialibrary.MediaLibraryUtils.deleteAssets;
import static expo.modules.medialibrary.MediaLibraryUtils.getInPart;


class DeleteAlbums extends AsyncTask<Void, Void, Void>{
  Context mContext;
  String mAlbumIds[];
  Promise mPromise;

  public DeleteAlbums(Context context, List<String> albumIds, Promise promise) {
    mContext = context;
    mPromise = promise;
    mAlbumIds = albumIds.toArray(new String[0]);
  }

  @Override
  protected Void doInBackground(Void... voids) {
    final String selection = Media.BUCKET_ID + " IN (" + getInPart(mAlbumIds) + " )";
    final String selectionArgs[] = mAlbumIds;
    deleteAssets(mContext, selection, selectionArgs, mPromise);
    return null;
  }
}
