package expo.modules.medialibrary;

import android.content.Context;
import android.content.ContentResolver;
import android.database.Cursor;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;

import org.unimodules.core.Promise;

import static expo.modules.medialibrary.MediaLibraryConstants.ASSET_PROJECTION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION;
import static expo.modules.medialibrary.MediaLibraryConstants.EXTERNAL_CONTENT;
import static expo.modules.medialibrary.MediaLibraryUtils.putAssetsInfo;

class GetAssets extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final Promise mPromise;
  private final Map<String, Object> mAssetOptions;

  public GetAssets(Context context, Map<String, Object> assetOptions, Promise promise) {
    mContext = context;
    mAssetOptions = assetOptions;
    mPromise = promise;
  }

  @Override
  protected Void doInBackground(Void... params) {
    final Bundle response = new Bundle();
    GetQueryInfo getQueryInfo = new GetQueryInfo(mAssetOptions).invoke();
    final String selection = getQueryInfo.getSelection();
    final String order = getQueryInfo.getOrder();
    final int limit = getQueryInfo.getLimit();
    final int offset = getQueryInfo.getOffset();
    ContentResolver contentResolver = mContext.getContentResolver();
    try (Cursor assets = contentResolver.query(
        EXTERNAL_CONTENT,
        ASSET_PROJECTION,
        selection,
        null,
        order)) {
      if (assets == null) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get assets. Query returns null.");
      } else {
        ArrayList<Bundle> assetsInfo = new ArrayList<>();
        putAssetsInfo(contentResolver, assets, assetsInfo, limit, offset, false);
        response.putParcelableArrayList("assets", assetsInfo);
        response.putBoolean("hasNextPage", !assets.isAfterLast());
        response.putString("endCursor", Integer.toString(assets.getPosition()));
        response.putInt("totalCount", assets.getCount());
        mPromise.resolve(response);
      }
    } catch (SecurityException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
          "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e);
    } catch (IOException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not read file or parse EXIF tags", e);
    }
    return null;
  }
}
