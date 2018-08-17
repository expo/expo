package expo.modules.medialibrary;

import android.content.Context;
import android.os.AsyncTask;
import android.provider.MediaStore;
import android.text.TextUtils;

import expo.core.Promise;

import static expo.modules.medialibrary.MediaLibraryUtils.deleteAssets;

class RemoveAssetsFromAlbum extends AsyncTask<Void, Void, Void> {

  private final Context mContext;
  private final String[] mAssetsId;
  private final String mAlbumId;
  private final Promise mPromise;

  RemoveAssetsFromAlbum(Context context, String[] assetsId, String albumId, Promise promise) {
    mContext = context;
    mAssetsId = assetsId;
    mAlbumId = albumId;
    mPromise = promise;
  }

  @Override
  protected Void doInBackground(Void... params) {
    final String bucketSelection = MediaStore.Images.Media.BUCKET_ID + "=? AND " + MediaStore.Images.Media._ID + " IN (" + TextUtils.join(",", mAssetsId) + " )";
    final String[] bucketId = {mAlbumId};
    deleteAssets(mContext, bucketSelection, bucketId, mPromise);
    return null;
  }
}
