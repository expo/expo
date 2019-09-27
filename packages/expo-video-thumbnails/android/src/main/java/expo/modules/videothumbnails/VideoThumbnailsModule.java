package expo.modules.videothumbnails;

import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.webkit.URLUtil;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.utilities.FileUtilities;
import org.unimodules.interfaces.filesystem.FilePermissionModuleInterface;
import org.unimodules.interfaces.filesystem.Permission;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class VideoThumbnailsModule extends ExportedModule {
    private static final String TAG = "ExpoVideoThumbnails";
    private static final String ERROR_TAG = "E_VIDEO_THUMBNAILS";

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

    private class GetThumbnailAsyncTask extends AsyncTask<Void, Void, Bitmap> {
        private String mSourceFilename;
        private ReadableArguments mVideoOptions;

        GetThumbnailAsyncTask(String sourceFilename, ReadableArguments videoOptions) {
            mSourceFilename = sourceFilename;
            mVideoOptions = videoOptions;
        }

        @Override
        protected final Bitmap doInBackground(Void... voids) {
            long time = mVideoOptions.getInt(KEY_TIME, 0) * 1000;
            Map headers = mVideoOptions.getMap(KEY_HEADERS, new HashMap<String, String>());
            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            if (URLUtil.isFileUrl(mSourceFilename)) {
                retriever.setDataSource(Uri.decode(mSourceFilename).replace("file://", ""));
            } else {
                retriever.setDataSource(mSourceFilename, headers);
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
        
        GetThumbnailAsyncTask getThumbnailAsyncTask = new GetThumbnailAsyncTask(sourceFilename, videoOptions) {
            @Override
            protected void onPostExecute(Bitmap thumbnail) {
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
