package expo.modules.gl;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;

import java.io.File;
import java.io.FileOutputStream;
import java.lang.ref.WeakReference;

import expo.core.Promise;
import expo.modules.gl.utils.FileSystemUtils;

public class TakeSnapshotAsyncTask extends AsyncTask<Void, Void, Void> {
  private final WeakReference<Context> mContext;
  private final int mWidth;
  private final int mHeight;
  private final boolean mFlip;
  private final String mFormat;
  private final int mCompress;
  private final int[] mDataArray;
  private final Promise mPromise;

  public TakeSnapshotAsyncTask(Context context, int width, int height, boolean flip, String format, int compress, int[] dataArray, Promise promise) {
    mContext = new WeakReference<Context>(context);
    mWidth = width;
    mHeight = height;
    mFlip = flip;
    mFormat = format;
    mCompress = compress;
    mDataArray = dataArray;
    mPromise = promise;
  }

  @Override
  protected Void doInBackground(Void... params) {
    // Convert RGBA data format to bitmap's ARGB
    for (int i = 0; i < mHeight; i++) {
      for (int j = 0; j < mWidth; j++) {
        int offset = i * mWidth + j;
        int pixel = mDataArray[offset];
        int blue = (pixel >> 16) & 0xff;
        int red = (pixel << 16) & 0x00ff0000;
        mDataArray[offset] = (pixel & 0xff00ff00) | red | blue;
      }
    }

    // Create Bitmap and flip
    Bitmap bitmap = Bitmap.createBitmap(mDataArray, mWidth, mHeight, Bitmap.Config.ARGB_8888);

    if (!mFlip) {
      // the bitmap is automatically flipped on Android, however we may want to unflip it
      // in case we take a snapshot from framebuffer that is already flipped
      Matrix flipMatrix = new Matrix();
      flipMatrix.postScale(1, -1, mWidth / 2, mHeight / 2);
      bitmap = Bitmap.createBitmap(bitmap, 0, 0, mWidth, mHeight, flipMatrix, true);
    }

    // Write bitmap to file
    String path = null;
    String extension = ".jpeg";
    FileOutputStream output = null;
    Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;

    if (mFormat != null && mFormat.equals("png")) {
      compressFormat = Bitmap.CompressFormat.PNG;
      extension = ".png";
    }

    Context context = mContext.get();

    if (context == null) {
      mPromise.reject("E_GL_CONTEXT_DESTROYED", "Context has been garbage collected.");
      return null;
    }

    try {
      path = FileSystemUtils.generateOutputPath(context.getCacheDir(), "GLView", extension);
      output = new FileOutputStream(path);
      bitmap.compress(compressFormat, mCompress, output);
      output.flush();
      output.close();
      output = null;

    } catch (Exception e) {
      e.printStackTrace();
      mPromise.reject("E_GL_CANT_SAVE_SNAPSHOT", e.getMessage());
    }

    if (output == null) {
      // Return result object which imitates Expo.Asset so it can be used again to fill the texture
      Bundle result = new Bundle();
      String fileUri = Uri.fromFile(new File(path)).toString();

      result.putString("uri", fileUri);
      result.putString("localUri", fileUri);
      result.putInt("width", mWidth);
      result.putInt("height", mHeight);

      mPromise.resolve(result);
    }
    return null;
  }
}