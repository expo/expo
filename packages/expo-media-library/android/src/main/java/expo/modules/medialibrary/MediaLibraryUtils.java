package expo.modules.medialibrary;

import android.content.Context;
import android.database.Cursor;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.MediaStore.Files;
import android.provider.MediaStore.Images.Media;
import android.support.media.ExifInterface;
import android.text.TextUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import expo.core.Promise;

import static expo.modules.medialibrary.MediaLibraryConstants.ASSET_PROJECTION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_IO_EXCEPTION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_ASSET;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_DELETE;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_SAVE_PERMISSION;
import static expo.modules.medialibrary.MediaLibraryConstants.EXTERNAL_CONTENT;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPES;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_AUDIO;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_PHOTO;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_UNKNOWN;
import static expo.modules.medialibrary.MediaLibraryConstants.MEDIA_TYPE_VIDEO;
import static expo.modules.medialibrary.MediaLibraryConstants.SORT_KEYS;
import static expo.modules.medialibrary.MediaLibraryConstants.exifTags;

final class MediaLibraryUtils {

  static final FileStrategy copyStrategy = new FileStrategy() {
    @Override
    public File apply(File src, File dir, Context context) throws IOException {
      return safeCopyFile(src, dir);
    }
  };
  static final FileStrategy moveStrategy = new FileStrategy() {
    @Override
    public File apply(File src, File dir, Context context) throws IOException {
      File newFile = safeMoveFile(src, dir);
      context.getContentResolver().delete(
          EXTERNAL_CONTENT,
          Media.DATA + "=?",
          new String[]{src.getPath()});
      return newFile;
    }
  };

  static String[] getFileNameAndExtension(String name) {
    int dot = name.lastIndexOf(".");
    dot = dot != -1 ? dot : name.length();

    String extension = name.substring(dot);
    String filename = name.substring(0, dot);
    return new String[]{filename, extension};
  }

  static File safeMoveFile(final File src, final File dir) throws IOException {
    File copy = safeCopyFile(src, dir);
    src.delete();
    return copy;
  }

  static File safeCopyFile(final File src, final File dir) throws IOException {
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

  static void queryAssetInfo(Context context, final String selection, final String[] selectionArgs, boolean fullInfo, Promise promise) {
    try (Cursor asset = context.getContentResolver().query(
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
          ArrayList<Bundle> array = new ArrayList<>();
          putAssetsInfo(asset, array, 1, 0, fullInfo);
          // actually we want to return just the first item, but array.getMap returns ReadableMap
          // which is not compatible with promise.resolve and there is no simple solution to convert
          // ReadableMap to WritableMap so it's easier to return an array and pick the first item on JS side
          promise.resolve(array);
        } else {
          promise.resolve(null);
        }
      }
    } catch (SecurityException e) {
      promise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
          "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e);
    } catch (IOException e) {
      promise.reject(ERROR_IO_EXCEPTION, "Could not read file or parse EXIF tags", e);
    }
  }

  static void putAssetsInfo(Cursor cursor, ArrayList<Bundle> response, int limit, int offset, boolean fullInfo) throws IOException {
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

      Bundle asset = new Bundle();
      asset.putString("id", cursor.getString(idIndex));
      asset.putString("filename", cursor.getString(filenameIndex));
      asset.putString("uri", localUri);
      asset.putString("mediaType", exportMediaType(mediaType));
      asset.putLong("width", size[0]);
      asset.putLong("height", size[1]);
      asset.putLong("creationTime", cursor.getLong(creationDateIndex));
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
          Bundle location = new Bundle();
          location.putDouble("latitude", latitude);
          location.putDouble("longitude", longitude);
          asset.putParcelable("location", location);
        } else {
          asset.putParcelable("location", null);
        }
      }
      cursor.moveToNext();
      response.add(asset);
    }
  }

  static String convertSortByKey(String key) throws IllegalArgumentException {
    if (!SORT_KEYS.containsKey(key)) {
      String errorMessage = String.format("SortBy key \"%s\" is not supported!", key);
      throw new IllegalArgumentException(errorMessage);
    }
    return SORT_KEYS.get(key);
  }

  static String exportMediaType(int mediaType) {
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

  static Integer convertMediaType(String mediaType) throws IllegalArgumentException {
    if (!MEDIA_TYPES.containsKey(mediaType)) {
      String errorMessage = String.format("MediaType \"%s\" is not supported!", mediaType);
      throw new IllegalArgumentException(errorMessage);
    }
    return MEDIA_TYPES.get(mediaType);
  }

  static int[] maybeRotateAssetSize(int width, int height, int orientation) {
    // given width and height might need to be swapped if the orientation is -90 or 90
    if (Math.abs(orientation) % 180 == 90) {
      return new int[]{height, width};
    } else {
      return new int[]{width, height};
    }
  }

  static String mapOrderDescriptor(List orderDescriptor) throws IllegalArgumentException {
    List<String> result = new ArrayList<>(20);

    for (Object item : orderDescriptor) {
      if (item instanceof String) {
        String key = convertSortByKey((String) item);
        result.add(key + " DESC");
      } else if (item instanceof Object[]) {
        Object array[] = (Object[]) item;
        if (array.length != 2) {
          throw new IllegalArgumentException("Array sortBy in assetsOptions has invalid layout.");
        }
        String key = convertSortByKey((String) array[0]);
        boolean order = (boolean) array[1];
        result.add(key + (order ? " ASC" : " DESC"));
      } else {
        throw new IllegalArgumentException("Array sortBy in assetsOptions contains invalid items.");
      }
    }
    return TextUtils.join(",", result);
  }

  static void getExifFullInfo(Cursor cursor, Bundle response) throws IOException {
    File input = new File(cursor.getString(cursor.getColumnIndex(Media.DATA)));
    ExifInterface exifInterface = new ExifInterface(input.getPath());
    Bundle exifMap = new Bundle();
    for (String[] tagInfo : exifTags) {
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
    response.putParcelable("exif", exifMap);
  }

  static void queryAlbum(Context context, final String selection, final String[] selectionArgs, Promise promise) {
    Bundle result = new Bundle();
    final String countColumn = "COUNT(*)";
    final String[] projection = {Media.BUCKET_ID, Media.BUCKET_DISPLAY_NAME, countColumn};
    final String group = "*/ GROUP BY " + Media.BUCKET_ID + " ORDER BY " + Media.BUCKET_DISPLAY_NAME;

    try (Cursor albums = context.getContentResolver().query(
        EXTERNAL_CONTENT,
        projection,
        selection,
        selectionArgs,
        group)) {

      if (albums == null) {
        promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get album. Query is incorrect.");
        return;
      }
      if (!albums.moveToNext()) {
        promise.resolve(null);
        return;
      }
      final int bucketIdIndex = albums.getColumnIndex(Media.BUCKET_ID);
      final int bucketDisplayNameIndex = albums.getColumnIndex(Media.BUCKET_DISPLAY_NAME);
      final int numOfItemsIndex = albums.getColumnIndex(countColumn);

      result.putString("id", albums.getString(bucketIdIndex));
      result.putString("title", albums.getString(bucketDisplayNameIndex));
      result.putInt("assetCount", albums.getInt(numOfItemsIndex));
      promise.resolve(result);
    } catch (SecurityException e) {
      promise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
          "Could not get albums: need READ_EXTERNAL_STORAGE permission.", e);
    }
  }

  static void deleteAssets(Context context, String selection, String[] selectionArgs, Promise promise) {
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

  static String getInPart(String assetsId[]) {
    int length = assetsId.length;
    String array[] = new String[length];
    Arrays.fill(array, "?");
    return TextUtils.join(",", array);
  }

  static List<File> getAssetsById(Context context, Promise promise, String... assetsId) {
    final String[] path = {Media.DATA};

    final String selection = MediaStore.Images.Media._ID + " IN ( " + getInPart(assetsId) + " )";

    try (Cursor assets = context.getContentResolver().query(
        EXTERNAL_CONTENT,
        path,
        selection,
        assetsId,
        null
    )) {

      if (assets == null) {
        promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get assets. Query returns null.");
        return null;
      } else if (assets.getCount() != assetsId.length) {
        promise.reject(ERROR_NO_ASSET, "Could not get all of the requested assets");
        return null;
      }
      List<File> assetFiles = new ArrayList<>();

      while (assets.moveToNext()) {
        final String assetPath = assets.getString(assets.getColumnIndex(MediaStore.Images.Media.DATA));
        File asset = new File(assetPath);

        if (!asset.exists() || !asset.isFile()) {
          promise.reject(ERROR_UNABLE_TO_LOAD, "Path " + assetPath + " does not exist or isn't file.");
          return null;
        }
        assetFiles.add(asset);
      }
      return assetFiles;
    }

  }

  interface FileStrategy {
    File apply(final File src, final File dir, Context context) throws IOException;
  }


}
