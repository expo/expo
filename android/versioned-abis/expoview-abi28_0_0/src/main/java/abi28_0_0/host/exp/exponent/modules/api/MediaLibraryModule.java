package abi28_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Context;
import android.database.ContentObserver;
import android.os.Environment;
import android.os.Handler;
import android.support.media.ExifInterface;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.AsyncTask;
import android.provider.MediaStore;
import android.database.Cursor;
import android.provider.MediaStore.Files;
import android.provider.MediaStore.Images.Media;
import android.util.Log;
import android.text.TextUtils;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.GuardedAsyncTask;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContext;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.ReadableArray;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.ReadableType;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.IOException;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.File;
import java.nio.channels.FileChannel;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.expoview.Exponent;
import abi28_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;

public class MediaLibraryModule extends ExpoKernelServiceConsumerBaseModule {
  private static final String TAG = "MediaLibraryModule";

  private static final String ERROR_UNABLE_TO_LOAD_PERMISSION = "E_UNABLE_TO_LOAD_PERMISSION";
  private static final String ERROR_UNABLE_TO_SAVE_PERMISSION = "E_UNABLE_TO_SAVE_PERMISSION";
  private static final String ERROR_UNABLE_TO_DELETE = "E_UNABLE_TO_DELETE";
  private static final String ERROR_UNABLE_TO_LOAD = "E_UNABLE_TO_LOAD";
  private static final String ERROR_UNABLE_TO_SAVE = "E_UNABLE_TO_SAVE";
  private static final String ERROR_NO_ALBUM = "E_NO_ALBUM";
  private static final String ERROR_MEDIA_LIBRARY_CORRUPTED = "E_MEDIA_LIBRARY_CORRUPTED";
  private static final String ERROR_NO_ASSET = "E_NO_ASSET";
  private static final String ERROR_IO_EXCEPTION = "E_IO_EXCEPTION";
  private static final String ERROR_NO_PERMISSIONS = "E_NO_PERMISSIONS";

  private static final String ERROR_NO_PERMISSIONS_MESSAGE = "Missing CAMERA_ROLL permissions.";

  private static final String MEDIA_TYPE_AUDIO = "audio";
  private static final String MEDIA_TYPE_PHOTO = "photo";
  private static final String MEDIA_TYPE_VIDEO = "video";
  private static final String MEDIA_TYPE_UNKNOWN = "unknown";
  private static final String MEDIA_TYPE_ALL = "all";

  private static final String SORT_BY_DEFAULT = "default";
  private static final String SORT_BY_ID = "id";
  private static final String SORT_BY_CREATION_TIME = "creationTime";
  private static final String SORT_BY_MODIFICATION_TIME = "modificationTime";
  private static final String SORT_BY_MEDIA_TYPE = "mediaType";
  private static final String SORT_BY_WIDTH = "width";
  private static final String SORT_BY_HEIGHT = "height";
  private static final String SORT_BY_DURATION = "duration";

  private static final String LIBRARY_DID_CHANGE_EVENT = "mediaLibraryDidChange";

  private static final Map<String, Integer> MEDIA_TYPES = new HashMap<String, Integer>() {
    {
      put(MEDIA_TYPE_AUDIO, Files.FileColumns.MEDIA_TYPE_AUDIO);
      put(MEDIA_TYPE_PHOTO, Files.FileColumns.MEDIA_TYPE_IMAGE);
      put(MEDIA_TYPE_VIDEO, Files.FileColumns.MEDIA_TYPE_VIDEO);
      put(MEDIA_TYPE_UNKNOWN, Files.FileColumns.MEDIA_TYPE_NONE);
    }
  };

  private static final Map<String, String> SORT_KEYS = new HashMap<String, String>() {
    {
      put(SORT_BY_DEFAULT, Media._ID);
      put(SORT_BY_ID, Media._ID);
      put(SORT_BY_CREATION_TIME, Media.DATE_TAKEN);
      put(SORT_BY_MODIFICATION_TIME, Media.DATE_MODIFIED);
      put(SORT_BY_MEDIA_TYPE, Files.FileColumns.MEDIA_TYPE);
      put(SORT_BY_WIDTH, Media.WIDTH);
      put(SORT_BY_HEIGHT, Media.HEIGHT);
      put(SORT_BY_DURATION, MediaStore.Video.VideoColumns.DURATION);
    }
  };

  private static final Uri EXTERNAL_CONTENT = Files.getContentUri("external");

  private static final String[] ASSET_PROJECTION = {
      Media._ID,
      Files.FileColumns.DISPLAY_NAME,
      Media.DATA,
      Files.FileColumns.MEDIA_TYPE,
      Media.WIDTH,
      Media.HEIGHT,
      Media.DATE_TAKEN,
      Media.DATE_MODIFIED,
      Media.LATITUDE,
      Media.LONGITUDE,
      Media.ORIENTATION,
      MediaStore.Video.VideoColumns.DURATION,
      Media.BUCKET_ID,
  };

  private MediaStoreContentObserver mImagesObserver = null;
  private MediaStoreContentObserver mVideosObserver = null;

  public MediaLibraryModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
  }

  @Override
  public String getName() {
    return "ExponentMediaLibrary";
  }

  @Nullable
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
            put("id", SORT_BY_ID);
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

  @ReactMethod
  public void createAssetAsync(String localUri, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new CreateAsset(getReactApplicationContext(), localUri, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class CreateAsset extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;
    private final Uri mUri;
    private final Promise mPromise;

    private CreateAsset(ReactContext context, String uri, Promise promise) {
      super(context);
      mContext = context;
      mUri = Uri.parse(uri);
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      try {
        File localFile = new File(mUri.getPath());
        File destDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM);
        File destFile = safeCopyFile(localFile, destDir);

        if (destFile.exists() && destFile.isFile()) {
          MediaScannerConnection.scanFile(mContext,
              new String[]{destFile.getPath()}, null,
              new MediaScannerConnection.OnScanCompletedListener() {
                @Override
                public void onScanCompleted(String path, Uri uri) {
                  if (uri != null) {
                    final String selection = Media.DATA + "=?";
                    final String[] args = {path};
                    queryAssetInfo(mContext, selection, args, false, mPromise);
                  } else {
                    mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not add image to gallery.");
                  }
                }
              });
        } else {
          mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not create asset record. Related file is not existing.");
        }
      } catch (IOException e) {
        mPromise.reject(ERROR_IO_EXCEPTION, "Unable to copy file into external storage.", e);
      } catch (SecurityException e) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
            "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e);
      }
    }
  }


  @ReactMethod
  public void addAssetsToAlbumAsync(ReadableArray assetsId, String albumId, boolean copyToAlbum, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new AddAssetsToAlbum(getReactApplicationContext(),
        unpackArray(assetsId, String[].class), albumId, copyToAlbum, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class AddAssetsToAlbum extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;
    private final String[] mAssetsId;
    private final String mAlbumId;
    private final boolean mCopyToAlbum;
    private final Promise mPromise;

    AddAssetsToAlbum(ReactContext context, String[] assetsId, String albumId, boolean copyToAlbum, Promise promise) {
      super(context);
      mContext = context;
      mAssetsId = assetsId;
      mAlbumId = albumId;
      mCopyToAlbum = copyToAlbum;
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      final String[] bucketPath = {Media.DATA};
      final String bucketSelection = Media.BUCKET_ID + "=?) /*";
      final String[] bucketId = {mAlbumId};
      final String limit = "*/ LIMIT 1";

      try (Cursor album = mContext.getContentResolver().query(
          EXTERNAL_CONTENT,
          bucketPath,
          bucketSelection,
          bucketId,
          limit)) {

        if (album == null) {
          mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get album. Query returns null.");
        } else if (album.getCount() == 0) {
          mPromise.reject(ERROR_NO_ALBUM, "No album with id: " + mAlbumId);
        } else {
          album.moveToNext();
          File fileInAlbum = new File(album.getString(album.getColumnIndex(Media.DATA)));

          // Media store table can be corrupted. Extra check won't harm anyone.
          if (!fileInAlbum.isFile()) {
            mPromise.reject(ERROR_MEDIA_LIBRARY_CORRUPTED, "Media library is corrupted");
            return;
          }

          File albumDir = new File(fileInAlbum.getParent());
          final String[] assetsData = {Media.DATA};
          final String assetsSelection = Media._ID + " IN ( " + TextUtils.join(",", mAssetsId) + " )";

          try (Cursor assets = mContext.getContentResolver().query(
              EXTERNAL_CONTENT,
              assetsData,
              assetsSelection,
              null,
              null
          )) {

            if (assets == null) {
              mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get assets. Query returns null.");
            } else if (assets.getCount() != mAssetsId.length) {
              mPromise.reject(ERROR_NO_ASSET, "Could not get all of the requested assets");
            } else {
              List<String> filesToScan = new ArrayList<>(assets.getCount());

              while (assets.moveToNext()) {
                final String assetPath = assets.getString(assets.getColumnIndex(Media.DATA));
                File assetToMove = new File(assetPath);
                if (!assetToMove.exists() || !assetToMove.isFile()) {
                  mPromise.reject(ERROR_UNABLE_TO_LOAD, "Path " + assetPath + " does not exist or isn't file.");
                  return;
                }

                File addedAsset;

                if (mCopyToAlbum) {
                  addedAsset = safeCopyFile(assetToMove, albumDir);
                } else {
                  addedAsset = safeMoveFile(assetToMove, albumDir);
                  mContext.getContentResolver().delete(
                      EXTERNAL_CONTENT,
                      Media.DATA + "=?",
                      new String[]{assetPath});
                }
                filesToScan.add(addedAsset.getPath());
              }

              MediaScannerConnection.scanFile(mContext,
                  filesToScan.toArray(new String[0]), null,
                  null);
              mPromise.resolve(true);
            }
          }
        }
      } catch (SecurityException e) {
        mPromise.reject(ERROR_UNABLE_TO_SAVE_PERMISSION,
            "Could not get albums: need WRITE_EXTERNAL_STORAGE permission.", e);
      } catch (IOException e) {
        mPromise.reject(ERROR_IO_EXCEPTION, "Unable to read or save data", e);
      }
    }
  }

  private static String[] getFileNameAndExtension(String fileName) {
    int dot = fileName.lastIndexOf(".");
    String extension;
    String filename;
    if (dot == -1) {
      extension = "";
      filename = fileName;
    } else {
      extension = fileName.substring(dot);
      filename = fileName.substring(0, dot);
    }
    return new String[]{filename, extension};
  }

  private static File safeMoveFile(final File src, final File dir) throws IOException {
    File copy = safeCopyFile(src, dir);
    src.delete();
    return copy;
  }

  private static File safeCopyFile(final File src, final File dir) throws IOException {
    File newFile = new File(dir, src.getName());
    int suffix = 0;
    final String[] origName = getFileNameAndExtension(src.getName());
    final int suffixLimit = Short.MAX_VALUE;
    while (newFile.exists()) {
      newFile = new File(dir, origName[0] + "_" + suffix + origName[1]);
      suffix++;
      if (suffix > suffixLimit) {
        throw new IOException("File name suffix limit reached (" + suffixLimit + ")");
      }
    }
    try (FileChannel in = new FileInputStream(src).getChannel();
         FileChannel out = new FileOutputStream(newFile).getChannel()) {
      final long transferred = in.transferTo(0, in.size(), out);
      if (transferred != in.size()) {
        newFile.delete();
        throw new IOException("Could not save file to " + dir + " Not enough space.");
      }
      return newFile;
    }
  }

  @ReactMethod
  public void removeAssetsFromAlbumAsync(ReadableArray assetsId, String albumId, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new RemoveAssetsFromAlbum(getReactApplicationContext(),
        unpackArray(assetsId, String[].class), albumId, promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }


  private static class RemoveAssetsFromAlbum extends GuardedAsyncTask<Void, Void> {

    private final Context mContext;
    private final String[] mAssetsId;
    private final String mAlbumId;
    private final Promise mPromise;

    RemoveAssetsFromAlbum(ReactContext context, String[] assetsId, String albumId, Promise promise) {
      super(context);
      mContext = context;
      mAssetsId = assetsId;
      mAlbumId = albumId;
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      final String bucketSelection = Media.BUCKET_ID + "=? AND " + Media._ID + " IN (" + TextUtils.join(",", mAssetsId) + " )";
      final String[] bucketId = {mAlbumId};
      deleteAssets(mContext, bucketSelection, bucketId, mPromise);
    }
  }

  @ReactMethod
  public void deleteAssetsAsync(ReadableArray assetsId, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new DeleteAssets(getReactApplicationContext(), unpackArray(assetsId, String[].class), promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class DeleteAssets extends GuardedAsyncTask<Void, Void> {

    private final Context mContext;
    private final String[] mAssetsId;
    private final Promise mPromise;

    DeleteAssets(ReactContext context, String[] assetsId, Promise promise) {
      super(context);
      mContext = context;
      mAssetsId = assetsId;
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      final String selection = Media._ID + " IN (" + TextUtils.join(",", mAssetsId) + " )";
      final String[] selectionArgs = null;
      deleteAssets(mContext, selection, selectionArgs, mPromise);
    }
  }

  private static void deleteAssets(Context context, String selection, String[] selectionArgs, Promise promise) {
    final String[] projection = {Media.DATA};
    try (Cursor filesToDelete = context.getContentResolver().query(
        EXTERNAL_CONTENT,
        projection,
        selection,
        selectionArgs,
        null)) {
      if (filesToDelete == null) {
        promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get album. Query returns null.");
      } else {
        while (filesToDelete.moveToNext()) {
          String filePath = filesToDelete.getString(filesToDelete.getColumnIndex(Media.DATA));
          File file = new File(filePath);
          if (file.delete()) {
            context.getContentResolver().delete(
                EXTERNAL_CONTENT,
                Media.DATA + " = \"" + filePath + "\"",
                null);
          } else {
            promise.reject(ERROR_UNABLE_TO_DELETE, "Could not delete file.");
            return;
          }
        }
        promise.resolve(true);
      }
    } catch (SecurityException e) {
      promise.reject(ERROR_UNABLE_TO_SAVE_PERMISSION,
          "Could not delete asset: need WRITE_EXTERNAL_STORAGE permission.", e);
    }
  }

  @ReactMethod
  public void getAssetInfoAsync(String id, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    final String selection = Media._ID + "=?";
    final String[] selectionArgs = {id};
    new GetAssetInfo(getReactApplicationContext(), selection, selectionArgs, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class GetAssetInfo extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;
    private final String mSelection;
    private final String[] mSelectionArgs;
    private final Promise mPromise;

    public GetAssetInfo(ReactContext context, String selection, String[] selectionArgs, Promise promise) {
      super(context);
      mContext = context;
      mSelection = selection;
      mSelectionArgs = selectionArgs;
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      queryAssetInfo(mContext, mSelection, mSelectionArgs, true, mPromise);
    }
  }

  private static void queryAssetInfo(Context reactContext, final String selection, final String[] selectionArgs, boolean fullInfo, Promise promise) {
    try (Cursor asset = reactContext.getContentResolver().query(
        EXTERNAL_CONTENT,
        ASSET_PROJECTION,
        selection,
        selectionArgs,
        null
    )) {
      if (asset == null) {
        promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get asset. Query returns null.");
      } else {
        if (asset.getCount() == 1) {
          asset.moveToFirst();
          WritableArray array = Arguments.createArray();
          putAssetsInfo(asset, array, 1, 0, fullInfo);

          // actually we want to return just the first item, but array.getMap returns ReadableMap
          // which is not compatible with promise.resolve and there is no simple solution to convert
          // ReadableMap to WritableMap so it's easier to return an array and pick the first item on JS side
          promise.resolve(array);
        }
      }
    } catch (SecurityException e) {
      promise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
          "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e);
    } catch (IOException e) {
      promise.reject(ERROR_IO_EXCEPTION, "Could not read file or parse EXIF tags", e);
    }
  }

  private static void putAssetsInfo(Cursor cursor, WritableArray response, int limit, int offset, boolean fullInfo) throws IOException{
    final int idIndex = cursor.getColumnIndex(Media._ID);
    final int filenameIndex = cursor.getColumnIndex(Media.DISPLAY_NAME);
    final int mediaTypeIndex = cursor.getColumnIndex(Files.FileColumns.MEDIA_TYPE);
    final int widthIndex = cursor.getColumnIndex(Media.WIDTH);
    final int heightIndex = cursor.getColumnIndex(Media.HEIGHT);
    final int latitudeIndex = cursor.getColumnIndex(Media.LATITUDE);
    final int longitudeIndex = cursor.getColumnIndex(Media.LONGITUDE);
    final int creationDateIndex = cursor.getColumnIndex(Media.DATE_TAKEN);
    final int modificationDateIndex = cursor.getColumnIndex(Media.DATE_MODIFIED);
    final int durationIndex = cursor.getColumnIndex(MediaStore.Video.VideoColumns.DURATION);
    final int orientationIndex = cursor.getColumnIndex(Media.ORIENTATION);
    final int localUriIndex = cursor.getColumnIndex(Media.DATA);
    final int albumIdIndex = cursor.getColumnIndex(Media.BUCKET_ID);

    if (!cursor.moveToPosition(offset)) {
      return;
    }
    for (int i = 0; i < limit && !cursor.isAfterLast(); i++) {
      String localUri = "file://" + cursor.getString(localUriIndex);
      int mediaType = cursor.getInt(mediaTypeIndex);
      int[] size = maybeRotateAssetSize(cursor.getInt(widthIndex), cursor.getInt(heightIndex), cursor.getInt(orientationIndex));

      WritableMap asset = Arguments.createMap();
      asset.putString("id", cursor.getString(idIndex));
      asset.putString("filename", cursor.getString(filenameIndex));
      asset.putString("uri", localUri);
      asset.putString("mediaType", exportMediaType(mediaType));
      asset.putInt("width", size[0]);
      asset.putInt("height", size[1]);
      asset.putDouble("creationTime", cursor.getLong(creationDateIndex));
      asset.putDouble("modificationTime", cursor.getLong(modificationDateIndex) * 1000d);
      asset.putDouble("duration", cursor.getInt(durationIndex) / 1000d);
      asset.putString("albumId", cursor.getString(albumIdIndex));

      if (fullInfo) {
        if (mediaType == Files.FileColumns.MEDIA_TYPE_IMAGE) {
          getExifFullInfo(cursor, asset);
        }

        asset.putString("localUri", localUri);

        double latitude = cursor.getDouble(latitudeIndex);
        double longitude = cursor.getDouble(longitudeIndex);

        // we want location to be null if it's not available
        if (latitude != 0.0 || longitude != 0.0) {
          WritableMap location = Arguments.createMap();
          location.putDouble("latitude", latitude);
          location.putDouble("longitude", longitude);
          asset.putMap("location", location);
        } else {
          asset.putNull("location");
        }
      }
      cursor.moveToNext();
      response.pushMap(asset);
    }
  }

  private static void getExifFullInfo(Cursor cursor, WritableMap response) throws IOException {
    File input = new File(cursor.getString(cursor.getColumnIndex(Media.DATA)));
    ExifInterface exifInterface = new ExifInterface(input.getPath());
    WritableMap exifMap = Arguments.createMap();
    for (String[] tagInfo : ImagePickerModule.exifTags) {
      String name = tagInfo[1];
      if (exifInterface.getAttribute(name) != null) {
        String type = tagInfo[0];
        switch (type) {
          case "string":
            exifMap.putString(name, exifInterface.getAttribute(name));
            break;
          case "int":
            exifMap.putInt(name, exifInterface.getAttributeInt(name, 0));
            break;
          case "double":
            exifMap.putDouble(name, exifInterface.getAttributeDouble(name, 0));
            break;
        }
      }
    }
    response.putMap("exif", exifMap);
  }

  @ReactMethod
  public void getAlbumsAsync(Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new GetAlbums(getReactApplicationContext(), promise).executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class GetAlbums extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;
    private final Promise mPromise;

    public GetAlbums(ReactContext context, Promise promise) {
      super(context);
      mContext = context;
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      WritableArray result = Arguments.createArray();
      final String countColumn = "COUNT(*)";
      final String[] projection = {Media.BUCKET_ID, Media.BUCKET_DISPLAY_NAME, countColumn};
      final String selection = Files.FileColumns.MEDIA_TYPE + " != " + Files.FileColumns.MEDIA_TYPE_NONE + ") /*";

      try (Cursor albums = mContext.getContentResolver().query(
          EXTERNAL_CONTENT,
          projection,
          selection,
          null,
          "*/ GROUP BY " + Media.BUCKET_ID +
              " ORDER BY " + Media.BUCKET_DISPLAY_NAME)) {

        if (albums == null) {
          mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get albums. Query returns null.");
        } else {
          final int bucketIdIndex = albums.getColumnIndex(Media.BUCKET_ID);
          final int bucketDisplayNameIndex = albums.getColumnIndex(Media.BUCKET_DISPLAY_NAME);
          final int numOfItemsIndex = albums.getColumnIndex(countColumn);

          while (albums.moveToNext()) {
            WritableMap album = Arguments.createMap();
            album.putString("id", albums.getString(bucketIdIndex));
            album.putString("title", albums.getString(bucketDisplayNameIndex));
            album.putNull("type");
            album.putInt("assetCount", albums.getInt(numOfItemsIndex));
            result.pushMap(album);
          }
          mPromise.resolve(result);
        }
      } catch (SecurityException e) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
            "Could not get albums: need READ_EXTERNAL_STORAGE permission.", e);
      }
    }
  }


  @ReactMethod
  public void getAlbumAsync(String albumName, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new GetAlbum(getReactApplicationContext(), albumName, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class GetAlbum extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;
    private final Promise mPromise;
    private final String mAlbumName;

    public GetAlbum(ReactContext context, String albumName, Promise promise) {
      super(context);
      mContext = context;
      mPromise = promise;
      mAlbumName = albumName;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      final String selection = Files.FileColumns.MEDIA_TYPE + " != " + Files.FileColumns.MEDIA_TYPE_NONE +
          " AND " + Media.BUCKET_DISPLAY_NAME + "=?) /*";
      final String[] selectionArgs = new String[]{mAlbumName};

      queryAlbum(mContext, selection, selectionArgs, mPromise);
    }
  }

  private static void queryAlbum(Context reactContext, final String selection, final String[] selectionArgs, Promise promise) {
    WritableMap result = Arguments.createMap();
    final String countColumn = "COUNT(*)";
    final String[] projection = {Media.BUCKET_ID, Media.BUCKET_DISPLAY_NAME, countColumn};
    final String group = "*/ GROUP BY " + Media.BUCKET_ID + " ORDER BY " + Media.BUCKET_DISPLAY_NAME;

    try (Cursor albums = reactContext.getContentResolver().query(
        EXTERNAL_CONTENT,
        projection,
        selection,
        selectionArgs,
        group)) {

      if (albums == null) {
        promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get album. Query is incorrect.");
      } else {
        if (albums.moveToNext()) {
          final int bucketIdIndex = albums.getColumnIndex(Media.BUCKET_ID);
          final int bucketDisplayNameIndex = albums.getColumnIndex(Media.BUCKET_DISPLAY_NAME);
          final int numOfItemsIndex = albums.getColumnIndex(countColumn);

          result.putString("id", albums.getString(bucketIdIndex));
          result.putString("title", albums.getString(bucketDisplayNameIndex));
          result.putInt("assetCount", albums.getInt(numOfItemsIndex));
          promise.resolve(result);
        } else {
          promise.resolve(null);
        }
      }
    } catch (SecurityException e) {
      promise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
          "Could not get albums: need READ_EXTERNAL_STORAGE permission.", e);
    }
  }

  @ReactMethod
  public void createAlbumAsync(String albumName, String assetId, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new CreateAlbum(getReactApplicationContext(), albumName, assetId, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class CreateAlbum extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;
    private final Promise mPromise;
    private final String mAlbumName;
    private final String mAssetId;

    public CreateAlbum(ReactContext context, String albumName, String assetId, Promise promise) {
      super(context);
      mContext = context;
      mAlbumName = albumName;
      mAssetId = assetId;
      mPromise = promise;
    }


    @Override
    protected void doInBackgroundGuarded(Void... params) {
      try {
        File albumDir = new File(Environment.getExternalStorageDirectory().getPath(), mAlbumName);

        if (!albumDir.exists() && !albumDir.mkdirs()) {
          mPromise.reject(ERROR_NO_ALBUM, "Could not create album directory.");
          return;
        }

        final String selection = Media._ID + " = " + mAssetId;

        try (Cursor assets = mContext.getContentResolver().query(
            EXTERNAL_CONTENT,
            new String[]{Files.FileColumns.DATA},
            selection,
            null,
            null)) {

          if (assets == null) {
            mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get asset. Query returns null.");
          } else {
            final int pathColumnIndex = assets.getColumnIndex(Media.DATA);

            if (assets.moveToNext()) {
              File fileToCopy = new File(assets.getString(pathColumnIndex));
              File fileCopy = safeCopyFile(fileToCopy, albumDir);

              MediaScannerConnection.scanFile(
                  mContext,
                  new String[]{fileCopy.getPath()},
                  null,
                  new MediaScannerConnection.OnScanCompletedListener() {
                    @Override
                    public void onScanCompleted(String path, Uri uri) {
                      if (path != null) {
                        final String selection = Media.DATA + "=?) /*";
                        final String[] args = {path};
                        queryAlbum(mContext, selection, args, mPromise);
                      } else {
                        mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not add image to album.");
                      }
                    }
                  });
            } else {
              mPromise.reject(ERROR_NO_ASSET, "Could not find asset");
            }
          }
        }
      } catch (SecurityException e) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
            "Could not create album: need WRITE_EXTERNAL_STORAGE permission.", e);
      } catch (IOException e) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not read file or parse EXIF tags", e);
      }
    }
  }

  @ReactMethod
  public void getAssetsAsync(ReadableMap assetOptions, Promise promise) {
    if (isMissingPermissions()) {
      promise.reject(ERROR_NO_PERMISSIONS, ERROR_NO_PERMISSIONS_MESSAGE);
      return;
    }

    new GetAssets(getReactApplicationContext(), assetOptions, promise)
        .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  private static class GetAssets extends GuardedAsyncTask<Void, Void> {
    private final Context mContext;
    private final Promise mPromise;
    private final ReadableMap mAssetOptions;

    public GetAssets(ReactContext context, ReadableMap assetOptions, Promise promise) {
      super(context);
      mContext = context;
      mAssetOptions = assetOptions;
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      final WritableMap response = Arguments.createMap();
      GetQueryInfo getQueryInfo = new GetQueryInfo(mAssetOptions).invoke();
      final String selection = getQueryInfo.getSelection();
      final String order = getQueryInfo.getOrder();
      final int limit = getQueryInfo.getLimit();
      final int offset = getQueryInfo.getOffset();
      try (Cursor assets = mContext.getContentResolver().query(
          EXTERNAL_CONTENT,
          ASSET_PROJECTION,
          selection,
          null,
          order)) {
        if (assets == null) {
          mPromise.reject(ERROR_UNABLE_TO_LOAD, "Could not get assets. Query returns null.");
        } else {
          WritableArray assetsInfo = Arguments.createArray();
          putAssetsInfo(assets, assetsInfo, limit, offset, false);
          response.putArray("assets", assetsInfo);
          response.putBoolean("hasNextPage", !assets.isAfterLast());
          response.putString("endCursor", Integer.toString(assets.getPosition()));
          response.putInt("totalCount", assets.getCount());
          mPromise.resolve(response);
        }
      } catch (SecurityException e) {
        mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
            "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e);
      } catch (IOException e) {
        Log.e(ERROR_UNABLE_TO_LOAD, "Could not read file or parse EXIF tags", e);
      }
    }
  }

  private static class GetQueryInfo {
    private ReadableMap mInput;
    private int mLimit;
    private StringBuilder mSelection;
    private StringBuilder mOrder;
    private int mOffset;

    GetQueryInfo(ReadableMap input) {
      mInput = input;
    }

    int getLimit() {
      return mLimit;
    }

    int getOffset() {
      return mOffset;
    }

    String getSelection() {
      return mSelection.toString();
    }

    String getOrder() {
      return mOrder.toString();
    }

    public GetQueryInfo invoke() {
      mLimit = mInput.hasKey("first") ? mInput.getInt("first") : 20;

      mSelection = new StringBuilder();
      if (mInput.hasKey("album")) {
        mSelection.append(Media.BUCKET_ID).append(" = ").append(mInput.getString("album"));
        mSelection.append(" AND ");
      }

      List<Object> mediaType = mInput.hasKey("mediaType") ? mInput.getArray("mediaType").toArrayList() : null;

      if (mediaType != null && !mediaType.contains(MEDIA_TYPE_ALL)) {
        List<Integer> mediaTypeInts = new ArrayList<Integer>();

        for (Object mediaTypeStr : mediaType) {
          mediaTypeInts.add(convertMediaType(mediaTypeStr.toString()));
        }
        mSelection.append(Files.FileColumns.MEDIA_TYPE).append(" IN (").append(TextUtils.join(",", mediaTypeInts)).append(")");
      } else {
        mSelection.append(Files.FileColumns.MEDIA_TYPE).append(" != ").append(Files.FileColumns.MEDIA_TYPE_NONE);
      }

      mOrder = new StringBuilder();
      if (mInput.hasKey("sortBy") && mInput.getArray("sortBy").size() > 0) {
        mOrder.append(mapOrderDescriptor(mInput.getArray("sortBy")));
      } else {
        mOrder.append(Media.DEFAULT_SORT_ORDER);
      }

      // to maintain compatibility with IOS field after is in string object
      mOffset = mInput.hasKey("after") ?
          Integer.parseInt(mInput.getString("after")) : 0;
      return this;
    }
  }

  // Library change observer

  @ReactMethod
  public void startObserving() {
    if (mImagesObserver != null) {
      return;
    }

    // We need to register an observer for each type of assets,
    // because it seems that observing a parent directory (EXTERNAL_CONTENT) doesn't work well,
    // whereas observing directory of images or videos works fine.

    Handler handler = new Handler();
    mImagesObserver = new MediaStoreContentObserver(handler, Files.FileColumns.MEDIA_TYPE_IMAGE);
    mVideosObserver = new MediaStoreContentObserver(handler, Files.FileColumns.MEDIA_TYPE_VIDEO);

    ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

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
  }

  @ReactMethod
  public void stopObserving() {
    if (mImagesObserver != null) {
      ContentResolver contentResolver = getReactApplicationContext().getContentResolver();

      contentResolver.unregisterContentObserver(mImagesObserver);
      contentResolver.unregisterContentObserver(mVideosObserver);

      mImagesObserver = null;
      mVideosObserver = null;
    }
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
        getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).
            emit(LIBRARY_DID_CHANGE_EVENT, Arguments.createMap());
      }
    }
  }

  // internals

  private int getAssetsTotalCount(int mediaType) {
    Cursor countCursor = getReactApplicationContext().getContentResolver().query(
        EXTERNAL_CONTENT,
        new String[] {"count(*) AS count"},
        Files.FileColumns.MEDIA_TYPE + " == " + mediaType,
        null,
        null
    );

    countCursor.moveToFirst();

    return countCursor.getInt(0);
  }

  private static Integer convertMediaType(String mediaType) throws IllegalArgumentException {
    if (!MEDIA_TYPES.containsKey(mediaType)) {
      String errorMessage = String.format("MediaType \"%s\" is not supported!", mediaType);
      throw new IllegalArgumentException(errorMessage);
    }
    return MEDIA_TYPES.get(mediaType);
  }

  private static String convertSortByKey(String key) throws IllegalArgumentException {
    if (!SORT_KEYS.containsKey(key)) {
      String errorMessage = String.format("SortBy key \"%s\" is not supported!", key);
      throw new IllegalArgumentException(errorMessage);
    }
    return SORT_KEYS.get(key);
  }

  private static String exportMediaType(int mediaType) {
    switch (mediaType) {
      case Files.FileColumns.MEDIA_TYPE_IMAGE:
        return MEDIA_TYPE_PHOTO;
      case Files.FileColumns.MEDIA_TYPE_AUDIO:
      case Files.FileColumns.MEDIA_TYPE_PLAYLIST:
        return MEDIA_TYPE_AUDIO;
      case Files.FileColumns.MEDIA_TYPE_VIDEO:
        return MEDIA_TYPE_VIDEO;
      default:
        return MEDIA_TYPE_UNKNOWN;
    }
  }

  private static int[] maybeRotateAssetSize(int width, int height, int orientation) {
    // given width and height might need to be swapped if the orientation is -90 or 90
    if (Math.abs(orientation) % 180 == 90) {
      return new int[]{ height, width };
    } else {
      return new int[]{ width, height };
    }
  }

  private static String mapOrderDescriptor(ReadableArray orderDescriptor) throws IllegalArgumentException {
    final int numOfDescriptors = orderDescriptor.size();
    String[] result = new String[numOfDescriptors];

    for (int i = 0; i < numOfDescriptors; i++) {
      final ReadableType item = orderDescriptor.getType(i);

      if (item == ReadableType.String) {
        String key = convertSortByKey(orderDescriptor.getString(i));
        result[i] = key + " DESC";
      } else if (item == ReadableType.Array) {
        ReadableArray subArray = orderDescriptor.getArray(i);

        if (subArray.size() != 2) {
          throw new IllegalArgumentException("Array sortBy in assetsOptions has invalid layout.");
        }
        String key = convertSortByKey(subArray.getString(0));
        result[i] = key + (subArray.getInt(1) > 0 ? " ASC" : " DESC");
      } else {
        throw new IllegalArgumentException("Array sortBy in assetsOptions contains invalid items.");
      }
    }
    return TextUtils.join(",", result);
  }

  private static <T> T[] unpackArray(ReadableArray input, Class<? extends T[]> newType) {
    final Object[] inputItems = input.toArrayList().toArray();
    return Arrays.copyOf(inputItems, inputItems.length, newType);
  }

  private boolean isMissingPermissions() {
    return !Exponent.getInstance().getPermissions(Manifest.permission.READ_EXTERNAL_STORAGE, this.experienceId) &&
        !Exponent.getInstance().getPermissions(Manifest.permission.WRITE_EXTERNAL_STORAGE, this.experienceId);
  }
}
