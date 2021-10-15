package expo.modules.medialibrary;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.provider.MediaStore;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;

import androidx.annotation.RequiresApi;
import expo.modules.core.Promise;

import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_IO_EXCEPTION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_FILE_EXTENSION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_SAVE;
import static expo.modules.medialibrary.MediaLibraryUtils.getEnvDirectoryForAssetType;
import static expo.modules.medialibrary.MediaLibraryUtils.mineTypeToExternalUri;
import static expo.modules.medialibrary.MediaLibraryUtils.queryAssetInfo;
import static expo.modules.medialibrary.MediaLibraryUtils.safeCopyFile;

class CreateAsset extends AsyncTask<Void, Void, Void> {
  private final Context mContext;
  private final Uri mUri;
  private final Promise mPromise;
  private final boolean resolveWithAdditionalData;

  CreateAsset(Context context, String uri, Promise promise) {
    this(context, uri, promise, true);
  }

  CreateAsset(Context context, String uri, Promise promise, boolean additionalData) {
    mContext = context;
    mUri = normalizeAssetUri(uri);
    mPromise = promise;
    resolveWithAdditionalData = additionalData;
  }

  private Uri normalizeAssetUri(String uri) {
    if (uri.startsWith("/")) {
      return Uri.fromFile(new File(uri));
    }
    return Uri.parse(uri);
  }

  private boolean isFileExtensionPresent() {
    String lastSegment = mUri.getLastPathSegment();
    return lastSegment != null && lastSegment.contains(".");
  }

  /**
   * Creates asset entry in database
   * @return uri to created asset
   */
  @RequiresApi(api = Build.VERSION_CODES.Q)
  private Uri createAssetWithContentResolver() {
    ContentResolver contentResolver = mContext.getContentResolver();

    String mimeType = MediaLibraryUtils.getType(contentResolver, mUri);
    String filename = mUri.getLastPathSegment();
    String path = MediaLibraryUtils.getRelativePathForAssetType(mimeType, true);

    ContentValues contentValues = new ContentValues();
    contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
    contentValues.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
    contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, path);
    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 1);

    Uri contentUri = mineTypeToExternalUri(mimeType);
    return contentResolver.insert(contentUri, contentValues);
  }

  /**
   * Same as {@link MediaLibraryUtils#safeCopyFile(File, File)} but takes Content URI as destination
   */
  @RequiresApi(api = Build.VERSION_CODES.R)
  private void writeFileContentsToAsset(File localFile, Uri assetUri) throws IOException {
    ContentResolver contentResolver = mContext.getContentResolver();

    try (FileChannel in = new FileInputStream(localFile).getChannel();
         FileChannel out = ((FileOutputStream) contentResolver.openOutputStream(assetUri)).getChannel()) {
      final long transferred = in.transferTo(0, in.size(), out);
      if (transferred != in.size()) {
        contentResolver.delete(assetUri, null);
        throw new IOException("Could not save file to " + assetUri + " Not enough space.");
      }
    }

    // After writing contents, set IS_PENDING flag back to 0
    ContentValues values = new ContentValues();
    values.put(MediaStore.MediaColumns.IS_PENDING, 0);
    contentResolver.update(assetUri, values, null, null);
  }

  private File createAssetFile() throws IOException {
    File localFile = new File(mUri.getPath());

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      Uri assetUri = createAssetWithContentResolver();
      if (assetUri == null) {
        mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not create content entry.");
        return null;
      }
      writeFileContentsToAsset(localFile, assetUri);

      if (resolveWithAdditionalData) {
        final String selection = MediaStore.MediaColumns._ID + "=?";
        final String[] args = {String.valueOf(ContentUris.parseId(assetUri))};
        queryAssetInfo(mContext, selection, args, false, mPromise);
      } else {
        mPromise.resolve(null);
      }
      // no further operations required, skip by returning null
      return null;
    } else {
      File destDir = getEnvDirectoryForAssetType(
          MediaLibraryUtils.getType(mContext.getContentResolver(), mUri),
          true
      );
      if (destDir == null) {
        mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not guess file type.");
        return null;
      }
      File destFile = safeCopyFile(localFile, destDir);

      if (!destDir.exists() || !destFile.isFile()) {
        mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not create asset record. Related file is not existing.");
        return null;
      }
      return destFile;
    }
  }

  @Override
  protected Void doInBackground(Void... params) {
    if (!isFileExtensionPresent()) {
      mPromise.reject(ERROR_NO_FILE_EXTENSION, "Could not get the file's extension.");
      return null;
    }

    try {
      File asset = createAssetFile();
      if (asset == null) {
        return null;
      }

      MediaScannerConnection.scanFile(mContext,
        new String[]{asset.getPath()},
        null,
        (path, uri) -> {
          if (uri == null) {
            mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not add image to gallery.");
            return;
          }
          if (resolveWithAdditionalData) {
            final String selection = MediaStore.Images.Media.DATA + "=?";
            final String[] args = {path};
            queryAssetInfo(mContext, selection, args, false, mPromise);
          } else {
            mPromise.resolve(null);
          }
        });
    } catch (IOException e) {
      mPromise.reject(ERROR_IO_EXCEPTION, "Unable to copy file into external storage.", e);
    } catch (SecurityException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e);
    } catch (Exception e) {
      mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not create asset.", e);
    }
    return null;
  }
}
