package expo.modules.imagepicker.tasks;

import android.content.ContentResolver;
import android.content.Context;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Bundle;

import org.unimodules.core.Promise;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import androidx.annotation.NonNull;
import expo.modules.imagepicker.ImagePickerConstance;
import expo.modules.imagepicker.ImagePickerFileUtils;

public class VideoResultTask extends ImagePickerResultTask {
  @NonNull
  private final MediaMetadataRetriever mMediaMetadataRetriever;

  public VideoResultTask(@NonNull Promise promise,
                         @NonNull Uri uri,
                         @NonNull ContentResolver contentResolver,
                         @NonNull final File cacheDir,
                         @NonNull MediaMetadataRetriever mediaMetadataRetriever) {
    super(promise, uri, contentResolver, cacheDir);
    mMediaMetadataRetriever = mediaMetadataRetriever;
  }

  @Override
  protected Void doInBackground(Void... params) {
    try {
      String path = getSavePath();
      saveVideo(path);

      Bundle response = new Bundle();
      response.putString("uri", Uri.fromFile(new File(path)).toString());
      response.putBoolean("cancelled", false);
      response.putString("type", "video");

      response.putInt("width", Integer.parseInt(mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)));
      response.putInt("height", Integer.parseInt(mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)));
      response.putInt("rotation", Integer.parseInt(mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)));
      response.putInt("duration", Integer.parseInt(mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)));

      mPromise.resolve(response);
    } catch (IllegalArgumentException | SecurityException e) {
      mPromise.reject(ImagePickerConstance.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstance.CAN_NOT_EXTRACT_METADATA_MESSAGE, e);
    } catch (IOException e) {
      mPromise.reject(ImagePickerConstance.ERR_CAN_NOT_SAVE_RESULT, ImagePickerConstance.CAN_NOT_SAVE_RESULT_MESSAGE, e);
    }

    return null;
  }

  private String getSavePath() throws IOException {
    return ImagePickerFileUtils.generateOutputPath(mCacheDir, "ImagePicker", ".mp4");
  }

  private void saveVideo(String path) throws IOException {
    try (InputStream in = mContentResolver.openInputStream(mUri);
         OutputStream out = new FileOutputStream(path)) {
      byte[] buffer = new byte[4096];
      int bytesRead;

      while ((bytesRead = in.read(buffer)) > 0) {
        out.write(buffer, 0, bytesRead);
      }
    }
  }
}
