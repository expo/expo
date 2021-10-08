package expo.modules.medialibrary;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.graphics.BitmapFactory;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.MediaStore.Files;
import android.text.TextUtils;
import android.util.Log;
import android.webkit.MimeTypeMap;

import expo.modules.core.Promise;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.exifinterface.media.ExifInterface;

import static expo.modules.medialibrary.MediaLibraryConstants.ASSET_PROJECTION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_IO_EXCEPTION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_ASSET;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_PERMISSIONS;
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

public final class MediaLibraryUtils {
  public static class AssetFile extends File {
    private final String mAssetId;
    private final String mMimeType;

    public AssetFile(@NonNull String pathname, String assetId, String mimeType) {
      super(pathname);
      mAssetId = assetId;
      mMimeType = mimeType;
    }

    public String getAssetId() {
      return mAssetId;
    }

    public String getMimeType() {
      return mMimeType;
    }
  }

  static String[] getFileNameAndExtension(String name) {
    int dot = name.lastIndexOf(".");
    dot = dot != -1 ? dot : name.length();

    String extension = name.substring(dot);
    String filename = name.substring(0, dot);
    return new String[]{filename, extension};
  }

  public static File safeMoveFile(final File src, final File dir) throws IOException {
    File copy = safeCopyFile(src, dir);
    src.delete();
    return copy;
  }

  public static File safeCopyFile(final File src, final File dir) throws IOException {
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
    ContentResolver contentResolver = context.getContentResolver();
    try (Cursor asset = contentResolver.query(
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
          putAssetsInfo(contentResolver, asset, array, 1, 0, fullInfo);
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
      promise.reject(ERROR_IO_EXCEPTION, "Could not read file", e);
    } catch (UnsupportedOperationException e)  {
      e.printStackTrace();
      promise.reject(ERROR_NO_PERMISSIONS, e.getMessage());
    }
  }

  static void putAssetsInfo(ContentResolver contentResolver, Cursor cursor, ArrayList<Bundle> response, int limit, int offset, boolean fullInfo) throws IOException, UnsupportedOperationException {
    final int idIndex = cursor.getColumnIndex(MediaStore.Images.Media._ID);
    final int filenameIndex = cursor.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME);
    final int mediaTypeIndex = cursor.getColumnIndex(Files.FileColumns.MEDIA_TYPE);
    final int creationDateIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATE_TAKEN);
    final int modificationDateIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATE_MODIFIED);
    final int durationIndex = cursor.getColumnIndex(MediaStore.Video.VideoColumns.DURATION);
    final int localUriIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATA);
    final int albumIdIndex = cursor.getColumnIndex(MediaStore.Images.Media.BUCKET_ID);

    if (!cursor.moveToPosition(offset)) {
      return;
    }
    for (int i = 0; i < limit && !cursor.isAfterLast(); i++) {
      String path = cursor.getString(localUriIndex);
      String localUri = "file://" + path;
      int mediaType = cursor.getInt(mediaTypeIndex);

      ExifInterface exifInterface = null;
      if (mediaType == Files.FileColumns.MEDIA_TYPE_IMAGE) {
        try {
          exifInterface = new ExifInterface(path);
        } catch (IOException e) {
          Log.w("expo-media-library", "Could not parse EXIF tags for " + localUri);
          e.printStackTrace();
        }
      }

      int[] size = getSizeFromCursor(contentResolver, exifInterface, cursor, mediaType, localUriIndex);

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
        if (exifInterface != null) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Uri photoUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cursor.getString(idIndex));
            getExifFullInfo(exifInterface, asset);
            getExifLocationForUri(contentResolver, photoUri, asset);
          } else {
            getExifFullInfo(exifInterface, asset);
            getExifLocation(exifInterface, asset);
          }
          asset.putString("localUri", localUri);
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

  static int[] getSizeFromCursor(ContentResolver contentResolver, ExifInterface exifInterface, Cursor cursor, int mediaType, int localUriIndex) throws IOException {
    final String uri = cursor.getString(localUriIndex);

    if (mediaType == Files.FileColumns.MEDIA_TYPE_VIDEO) {
      Uri videoUri = Uri.parse("file://" + uri);
      MediaMetadataRetriever retriever = null;
      try (AssetFileDescriptor photoDescriptor = contentResolver.openAssetFileDescriptor(videoUri, "r")) {
        retriever = new MediaMetadataRetriever();
        retriever.setDataSource(photoDescriptor.getFileDescriptor());
        int videoWidth = Integer.parseInt(
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
        );
        int videoHeight = Integer.parseInt(
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
        );
        int videoOrientation = Integer.parseInt(
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
        );
        return maybeRotateAssetSize(videoWidth, videoHeight, videoOrientation);
      } catch (NumberFormatException e) {
        Log.e("expo-media-library", "MediaMetadataRetriever unexpectedly returned non-integer: " + e.getMessage());
      } catch (FileNotFoundException e) {
        Log.e("expo-media-library", String.format("ContentResolver failed to read %s: %s", uri, e.getMessage()));
      } catch (RuntimeException e) {
        Log.e("expo-media-library", "MediaMetadataRetriever finished with unexpected error: " + e.getMessage());
      } finally {
        if (retriever != null) {
          retriever.release();
        }
      }
    }

    final int widthIndex = cursor.getColumnIndex(MediaStore.MediaColumns.WIDTH);
    final int heightIndex = cursor.getColumnIndex(MediaStore.MediaColumns.HEIGHT);
    final int orientationIndex = cursor.getColumnIndex(MediaStore.Images.Media.ORIENTATION);
    int width = cursor.getInt(widthIndex);
    int height = cursor.getInt(heightIndex);
    int orientation = cursor.getInt(orientationIndex);

    // If the image doesn't have the required information, we can get them from Bitmap.Options
    if (mediaType == Files.FileColumns.MEDIA_TYPE_IMAGE && (width <= 0 || height <= 0)) {
      BitmapFactory.Options options = new BitmapFactory.Options();
      options.inJustDecodeBounds = true;
      BitmapFactory.decodeFile(uri, options);
      width = options.outWidth;
      height = options.outHeight;
    }

    if (exifInterface != null) {
      int exifOrientation = exifInterface.getAttributeInt(
        ExifInterface.TAG_ORIENTATION,
        ExifInterface.ORIENTATION_NORMAL
      );
      if (
        exifOrientation == ExifInterface.ORIENTATION_ROTATE_90 ||
          exifOrientation == ExifInterface.ORIENTATION_ROTATE_270 ||
          exifOrientation == ExifInterface.ORIENTATION_TRANSPOSE ||
          exifOrientation == ExifInterface.ORIENTATION_TRANSVERSE
      ) {
        orientation = 90;
      }
    }

    return maybeRotateAssetSize(width, height, orientation);
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
      } else if (item instanceof ArrayList) {
        ArrayList array = (ArrayList) item;
        if (array.size() != 2) {
          throw new IllegalArgumentException("Array sortBy in assetsOptions has invalid layout.");
        }
        String key = convertSortByKey((String) array.get(0));
        boolean order = (boolean) array.get(1);
        result.add(key + (order ? " ASC" : " DESC"));
      } else {
        throw new IllegalArgumentException("Array sortBy in assetsOptions contains invalid items.");
      }
    }
    return TextUtils.join(",", result);
  }

  static void getExifFullInfo(ExifInterface exifInterface, Bundle response) {
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

  // API 29+ adds "scoped storage" which requires extra permissions (ACCESS_MEDIA_LOCATION) to access photo data
  // Reference: https://developer.android.com/training/data-storage/shared/media#location-info-photos
  @RequiresApi(api = Build.VERSION_CODES.Q)
  static void getExifLocationForUri(ContentResolver contentResolver, Uri photoUri, Bundle asset) throws UnsupportedOperationException, IOException {
    InputStream stream;

    try {
      // Exception occurs if ACCESS_MEDIA_LOCATION permission isn't granted
      photoUri = MediaStore.setRequireOriginal(photoUri);
      stream = contentResolver.openInputStream(photoUri);
    } catch (UnsupportedOperationException e) {
      throw new UnsupportedOperationException("Cannot access ExifInterface because of missing ACCESS_MEDIA_LOCATION permission");
    }

    if (stream != null) {
      try {
        // If exif data cannot be found on the stream, set location to null instead of rejecting
        ExifInterface exifInterface = new ExifInterface(stream);
        double[] latLong = exifInterface.getLatLong();

        if (latLong != null) {
          Bundle location = new Bundle();
          location.putDouble("latitude", latLong[0]);
          location.putDouble("longitude", latLong[1]);
          asset.putParcelable("location", location);
        } else {
          asset.putParcelable("location", null);
        }
      } catch(IOException e) {
        asset.putParcelable("location", null);
      } finally {
        stream.close();
      }
    }
  }

  static void getExifLocation(ExifInterface exifInterface, Bundle asset) {

    double[] latLong = exifInterface.getLatLong();

    if (latLong == null) {
      asset.putParcelable("location", null);
      return;
    }

    Bundle location = new Bundle();
    location.putDouble("latitude", latLong[0]);
    location.putDouble("longitude", latLong[1]);
    asset.putParcelable("location", location);
  }



  public static void deleteAssets(Context context, String selection, String[] selectionArgs, Promise promise) {
    final String[] projection = {MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DATA};
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
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            long id = filesToDelete.getLong(filesToDelete.getColumnIndex(MediaStore.MediaColumns._ID));
            Uri assetUri = ContentUris.withAppendedId(EXTERNAL_CONTENT, id);
            context.getContentResolver().delete(assetUri, null);
          } else {
            String filePath = filesToDelete.getString(filesToDelete.getColumnIndex(MediaStore.MediaColumns.DATA));
            File file = new File(filePath);
            if (file.delete()) {
              context.getContentResolver().delete(
                EXTERNAL_CONTENT,
                MediaStore.MediaColumns.DATA + "=?",
                new String[]{filePath});
            } else {
              promise.reject(ERROR_UNABLE_TO_DELETE, "Could not delete file.");
              return;
            }
          }
        }
        promise.resolve(true);
      }
    } catch (SecurityException e) {
      promise.reject(ERROR_UNABLE_TO_SAVE_PERMISSION,
        "Could not delete asset: need WRITE_EXTERNAL_STORAGE permission.", e);
    } catch (Exception e) {
      e.printStackTrace();
      promise.reject(ERROR_UNABLE_TO_DELETE, "Could not delete file.", e);
    }
  }

  public static String getInPart(String[] assetsId) {
    int length = assetsId.length;
    String[] array = new String[length];
    Arrays.fill(array, "?");
    return TextUtils.join(",", array);
  }

  // Used in albums and migrations only - consider moving it there
  public static List<AssetFile> getAssetsById(Context context, Promise promise, String... assetsId) {
    if (promise == null) {
      promise = new Promise() {
        @Override
        public void resolve(Object value) {
        }

        @Override
        public void reject(String code, String message, Throwable e) {
        }
      };
    }

    final String[] path = {MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DATA, MediaStore.MediaColumns.BUCKET_ID, MediaStore.MediaColumns.MIME_TYPE};
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
      List<AssetFile> assetFiles = new ArrayList<>();

      while (assets.moveToNext()) {
        final String assetPath = assets.getString(assets.getColumnIndex(MediaStore.Images.Media.DATA));
        AssetFile asset = new AssetFile(
          assetPath,
          assets.getString(assets.getColumnIndex(MediaStore.MediaColumns._ID)),
          assets.getString(assets.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE))
        );

        if (!asset.exists() || !asset.isFile()) {
          promise.reject(ERROR_UNABLE_TO_LOAD, "Path " + assetPath + " does not exist or isn't file.");
          return null;
        }
        assetFiles.add(asset);
      }
      return assetFiles;
    }
  }

  private static String getTypeFromFileUrl(String url) {
    String extension = MimeTypeMap.getFileExtensionFromUrl(url);
    if (extension == null) {
      return null;
    }

    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
  }

  public static String getType(ContentResolver contentResolver, Uri uri) {
    String type = contentResolver.getType(uri);

    if (type == null) {
      return getTypeFromFileUrl(uri.toString());
    }
    return type;
  }

  public static List<Uri> getAssetsUris(Context context, List<String> assetsId) {
    List<Uri> result = new ArrayList<>();

    final String selection = MediaStore.MediaColumns._ID + " IN (" + TextUtils.join(",", assetsId) + " )";
    final String[] selectionArgs = null;
    final String[] projection = {MediaStore.MediaColumns._ID, MediaStore.MediaColumns.MIME_TYPE};

    try (Cursor cursor = context.getContentResolver().query(
      EXTERNAL_CONTENT,
      projection,
      selection,
      selectionArgs,
      null)) {
      if (cursor == null) {
        return result;
      }

      while (cursor.moveToNext()) {
        long id = cursor.getLong(cursor.getColumnIndex(MediaStore.MediaColumns._ID));
        String mineType = cursor.getString(cursor.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE));

        Uri assetUri = ContentUris.withAppendedId(mineTypeToExternalUri(mineType), id);
        result.add(assetUri);
      }
    }
    return result;
  }

  public static Uri mineTypeToExternalUri(String mineType) {
    if (mineType == null || mineType.contains("image")) {
      return MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
    } else if (mineType.contains("video")) {
      return MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
    } else if (mineType.contains("audio")) {
      return MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
    }

    // For backward compatibility
    return EXTERNAL_CONTENT;
  }

  public static String getRelativePathForAssetType(String mimeType, boolean useCameraDir) {
    if (mimeType.contains("image") || mimeType.contains("video")) {
      return useCameraDir ? Environment.DIRECTORY_DCIM : Environment.DIRECTORY_PICTURES;
    } else if (mimeType.contains("audio")) {
      return Environment.DIRECTORY_MUSIC;
    }

    // For backward compatibility
    return useCameraDir ? Environment.DIRECTORY_DCIM : Environment.DIRECTORY_PICTURES;
  }

  public static File getEnvDirectoryForAssetType(String mimeType, boolean useCameraDir) {
    return Environment.getExternalStoragePublicDirectory(getRelativePathForAssetType(mimeType, useCameraDir));
  }
}