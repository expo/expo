package expo.modules.medialibrary;

import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Environment;
import android.provider.MediaStore;

import org.unimodules.core.Promise;

import java.io.File;
import java.io.IOException;

import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_IO_EXCEPTION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_NO_FILE_EXTENSION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION;
import static expo.modules.medialibrary.MediaLibraryConstants.ERROR_UNABLE_TO_SAVE;
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

  private File createAssetFile() throws IOException {
    File localFile = new File(mUri.getPath());
    File destDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM);
    File destFile = safeCopyFile(localFile, destDir);

    if (!destDir.exists() || !destFile.isFile()) {
      mPromise.reject(ERROR_UNABLE_TO_SAVE, "Could not create asset record. Related file is not existing.");
      return null;
    }
    return destFile;
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

        new MediaScannerConnection.OnScanCompletedListener() {
          @Override
          public void onScanCompleted(String path, Uri uri) {
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
          }
        });
    } catch (IOException e) {
      mPromise.reject(ERROR_IO_EXCEPTION, "Unable to copy file into external storage.", e);
    } catch (SecurityException e) {
      mPromise.reject(ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e);
    }
    return null;
  }

}
