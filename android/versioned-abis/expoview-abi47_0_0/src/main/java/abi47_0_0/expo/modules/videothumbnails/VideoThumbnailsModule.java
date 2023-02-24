package abi47_0_0.expo.modules.videothumbnails;

import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.webkit.URLUtil;

import abi47_0_0.expo.modules.core.ExportedModule;
import abi47_0_0.expo.modules.core.ModuleRegistry;
import abi47_0_0.expo.modules.core.Promise;
import abi47_0_0.expo.modules.core.arguments.ReadableArguments;
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod;
import abi47_0_0.expo.modules.core.utilities.FileUtilities;

import java.io.File;
import java.io.FileDescriptor;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;

import abi47_0_0.expo.modules.interfaces.filesystem.FilePermissionModuleInterface;
import abi47_0_0.expo.modules.interfaces.filesystem.Permission;

public class VideoThumbnailsModule extends ExportedModule {
  private static final String TAG = "ExpoVideoThumbnails";
  private static final String ERROR_TAG = "E_VIDEO_THUMBNAILS";
  private static String ERR_COULD_NOT_GET_THUMBNAIL = "ERR_COULD_NOT_GET_THUMBNAIL";

  private static final String KEY_QUALITY = "quality";
  private static final String KEY_TIME = "time";
  private static final String KEY_HEADERS = "headers";

  private ModuleRegistry mModuleRegistry;

  public VideoThumbnailsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  private static class GetThumbnailAsyncTask extends AsyncTask<Void, Void, Bitmap> {
    private String mSourceFilename;
    private ReadableArguments mVideoOptions;
    private Context mContext;
    Exception mError;

    GetThumbnailAsyncTask(String sourceFilename, ReadableArguments videoOptions, Context context) {
      mSourceFilename = sourceFilename;
      mVideoOptions = videoOptions;
      mContext = context;
    }

    @Override
    protected final Bitmap doInBackground(Void... voids) {
      long time = mVideoOptions.getInt(KEY_TIME, 0) * 1000;
      MediaMetadataRetriever retriever = new MediaMetadataRetriever();
      try {
        if (URLUtil.isFileUrl(mSourceFilename)) {
          retriever.setDataSource(Uri.decode(mSourceFilename).replace("file://", ""));
        } else if (URLUtil.isContentUrl(mSourceFilename)) {
          Uri fileUri = Uri.parse(mSourceFilename);
          FileDescriptor fileDescriptor = mContext.getContentResolver().openFileDescriptor(fileUri, "r").getFileDescriptor();
          FileInputStream inputStream = new FileInputStream(fileDescriptor);
          retriever.setDataSource(inputStream.getFD());
        } else {
          retriever.setDataSource(mSourceFilename, mVideoOptions.getMap(KEY_HEADERS, new HashMap<String, String>()));
        }
      } catch (IOException | RuntimeException e) {
        mError = e;
        return null;
      }

      return retriever.getFrameAtTime(time, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
    }
  }

  private boolean isAllowedToRead(String url) {
    if (mModuleRegistry != null) {
      FilePermissionModuleInterface permissionModuleInterface = mModuleRegistry.getModule(FilePermissionModuleInterface.class);
      if (permissionModuleInterface != null) {
        return permissionModuleInterface.getPathPermissions(getContext(), url).contains(Permission.READ);
      }
    }
    return true;
  }

  @ExpoMethod
  public void getThumbnail(String sourceFilename, final ReadableArguments videoOptions, final Promise promise) {
    if (URLUtil.isFileUrl(sourceFilename) && !isAllowedToRead(Uri.decode(sourceFilename).replace("file://", ""))) {
      promise.reject(ERROR_TAG, "Can't read file");
      return;
    }

    GetThumbnailAsyncTask getThumbnailAsyncTask = new GetThumbnailAsyncTask(sourceFilename, videoOptions, getContext()) {
      @Override
      protected void onPostExecute(Bitmap thumbnail) {
        if (thumbnail == null || mError != null) {
          String errorMessage = "Could not generate thumbnail.";
          if (mError != null) {
            errorMessage = String.format("%s %s", errorMessage, mError.getMessage());
          }
          promise.reject(ERR_COULD_NOT_GET_THUMBNAIL, errorMessage, mError);
          return;
        }
        try {
          String path = FileUtilities.generateOutputPath(getContext().getCacheDir(), "VideoThumbnails", "jpg");
          OutputStream outputStream = new FileOutputStream(path);
          thumbnail.compress(Bitmap.CompressFormat.JPEG, (int) (videoOptions.getDouble(KEY_QUALITY, 1) * 100), outputStream);
          outputStream.flush();
          outputStream.close();
          Bundle response = new Bundle();
          response.putString("uri", Uri.fromFile(new File(path)).toString());
          response.putInt("width", thumbnail.getWidth());
          response.putInt("height", thumbnail.getHeight());
          promise.resolve(response);
        } catch (IOException ex) {
          promise.reject(ERROR_TAG, ex);
        }
      }
    };
    getThumbnailAsyncTask.execute();
  }
}
