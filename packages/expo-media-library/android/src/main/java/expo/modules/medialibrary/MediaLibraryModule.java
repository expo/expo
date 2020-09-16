package expo.modules.medialibrary;

import android.content.ContentResolver;
import android.content.Context;
import android.database.ContentObserver;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.provider.MediaStore;
import android.provider.MediaStore.Files;
import android.provider.MediaStore.Images.Media;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.interfaces.permissions.Permissions;

import static android.Manifest.permission.READ_EXTERNAL_STORAGE;
import static android.Manifest.permission.WRITE_EXTERNAL_STORAGE;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_PERMISSIONS;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_PERMISSIONS_MESSAGE;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_WRITE_PERMISSION_MESSAGE;
import static expo.modules.medialibrary.MediaLibraryConstants.EXTERNAL_CONTENT;
import static expo.modules.medialibrary.MediaLibraryConstants.LIBRARY_DID_CHANGE_EVENT;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_ALL;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_AUDIO;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_PHOTO;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_UNKNOWN;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_VIDEO;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_BY_CREATION_TIME;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_BY_DEFAULT;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_BY_DURATION;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_BY_HEIGHT;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_BY_MEDIA_TYPE;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_BY_MODIFICATION_TIME;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_BY_WIDTH;


public class MediaLibraryModule extends ExportedModule {

  private MediaStoreContentObserver mImagesObserver = null;
  private MediaStoreContentObserver mVideosObserver = null;
  private Context mContext;
  private ModuleRegistry mModuleRegistry;

  public MediaLibraryModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return "ExponentMediaLibrary";
  }

  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("MediaType", Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("audio", MEDIA_TYPE_AUDIO);
            put("photo", MEDIA_TYPE_PHOTO);
            put("video", MEDIA_TYPE_VIDEO);
            put("unknown", MEDIA_TYPE_UNKNOWN);
            put("all", MEDIA_TYPE_ALL);
          }
        }));
        put("SortBy", Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("default", SORT_BY_DEFAULT);
            put("creationTime", SORT_BY_CREATION_TIME);
            put("modificationTime", SORT_BY_MODIFICATION_TIME);
            put("mediaType", SORT_BY_MEDIA_TYPE);
            put("width", SORT_BY_WIDTH);
            put("height", SORT_BY_HEIGHT);
            put("duration", SORT_BY_DURATION);
          }
        }));
        put("CHANGE_LISTENER_NAME", LIBRARY_DID_CHANGE_EVENT);
      }
    });
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void requestPermissionsAsync(final Promise promise) {
    Permissions.askForPermissionsWithPermissionsManager(mModuleRegistry.getModule(Permissions.class), promise, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE);
  }

  @ExpoMethod
  public void getPermissionsAsync(final Promise promise) {
    Permissions.getPermissionsWithPermissionsManager(mModuleRegistry.getModule(Permissions.class), promise, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE);
  }

  @ExpoMethod
  public void saveToLibraryAsync(String localUri, Promise promise) {
    if (isMissingWritePermission()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_WRITE_PERMISSION_MESSAGE);
      return;
    }

    new CreateAsset(mContext, localUri, promise, false)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @ExpoMethod
  public void createAssetAsync(String localUri, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new CreateAsset(mContext, localUri, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @ExpoMethod
  public void addAssetsToAlbumAsync(List<String> assetsId, String albumId, boolean copyToAlbum, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new AddAssetsToAlbum(mContext,
        assetsId.toArray(new String[0]), albumId, copyToAlbum, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }


  @ExpoMethod
  public void removeAssetsFromAlbumAsync(List<String> assetsId, String albumId, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new RemoveAssetsFromAlbum(mContext,
        assetsId.toArray(new String[0]), albumId, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @ExpoMethod
  public void deleteAssetsAsync(List<String> assetsId, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new DeleteAssets(mContext, assetsId.toArray(new String[0]), promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @ExpoMethod
  public void getAssetInfoAsync(String assetId, Map<String, Object> options /* unused on android atm */, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new GetAssetInfo(mContext, assetId, promise).
        executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }


  @ExpoMethod
  public void getAlbumsAsync(Map<String, Object> options /* unused on android atm */, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new GetAlbums(mContext, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }


  @ExpoMethod
  public void getAlbumAsync(String albumName, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new GetAlbum(mContext, albumName, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @ExpoMethod
  public void createAlbumAsync(String albumName, String assetId, boolean copyAsset, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new CreateAlbum(mContext, albumName, assetId, copyAsset, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @ExpoMethod
  public void deleteAlbumsAsync(List<String> albumIds, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new DeleteAlbums(mContext, albumIds, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);

  }

  @ExpoMethod
  public void getAssetsAsync(Map<String, Object> assetOptions, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new GetAssets(mContext, assetOptions, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  // Library change observer

  @ExpoMethod
  public void startObserving(Promise promise) {
    if (mImagesObserver != null) {
      promise.resolve(null);
      return;
    }

    // We need to register an observer for each type of assets,
    // because it seems that observing a parent directory (EXTERNAL_CONTENT) doesn't work well,
    // whereas observing directory of images or videos works fine.

    Handler handler = new Handler();
    mImagesObserver = new MediaStoreContentObserver(handler, Files.FileColumns.MEDIA_TYPE_IMAGE);
    mVideosObserver = new MediaStoreContentObserver(handler, Files.FileColumns.MEDIA_TYPE_VIDEO);

    ContentResolver contentResolver = mContext.getContentResolver();

    contentResolver.registerContentObserver(
        Media.EXTERNAL_CONTENT_URI,
        true,
        mImagesObserver
    );
    contentResolver.registerContentObserver(
        MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
        true,
        mVideosObserver
    );
    promise.resolve(null);
  }

  @ExpoMethod
  public void stopObserving(Promise promise) {
    if (mImagesObserver != null) {
      ContentResolver contentResolver = mContext.getContentResolver();

      contentResolver.unregisterContentObserver(mImagesObserver);
      contentResolver.unregisterContentObserver(mVideosObserver);

      mImagesObserver = null;
      mVideosObserver = null;
    }
    promise.resolve(null);
  }

  private boolean isMissingPermissions() {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      return false;
    }

    return !permissionsManager.hasGrantedPermissions(READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE);
  }

  private boolean isMissingWritePermission() {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      return false;
    }

    return !permissionsManager.hasGrantedPermissions(WRITE_EXTERNAL_STORAGE);
  }

  private class MediaStoreContentObserver extends ContentObserver {
    private int mAssetsTotalCount;
    private int mMediaType;

    public MediaStoreContentObserver(Handler handler, int mediaType) {
      super(handler);
      mMediaType = mediaType;
      mAssetsTotalCount = getAssetsTotalCount(mMediaType);
    }

    @Override
    public void onChange(boolean selfChange) {
      this.onChange(selfChange, null);
    }

    @Override
    public void onChange(boolean selfChange, Uri uri) {
      int newTotalCount = getAssetsTotalCount(mMediaType);

      // Send event to JS only when assets count has been changed - to filter out some unnecessary events.
      // It's not perfect solution if someone adds and deletes the same number of assets in a short period of time, but I hope these events will not be batched.
      if (mAssetsTotalCount != newTotalCount) {
        mAssetsTotalCount = newTotalCount;
        mModuleRegistry.getModule(EventEmitter.class).emit(LIBRARY_DID_CHANGE_EVENT, new Bundle());
      }
    }

    private int getAssetsTotalCount(int mediaType) {
      Cursor countCursor = mContext.getContentResolver().query(
          EXTERNAL_CONTENT,
          null,
          Files.FileColumns.MEDIA_TYPE + " == " + mediaType,
          null,
          null
      );

      return countCursor != null ? countCursor.getCount() : 0;
    }
  }
}
