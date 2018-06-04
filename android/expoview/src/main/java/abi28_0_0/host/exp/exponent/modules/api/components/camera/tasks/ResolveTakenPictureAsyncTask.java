package abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.AsyncTask;
import android.support.media.ExifInterface;
import android.util.Base64;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import host.exp.exponent.utils.ExpFileUtils;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.ExpoCameraViewHelper;

public class ResolveTakenPictureAsyncTask extends AsyncTask<Void, Void, WritableMap> {
  private static final String ERROR_TAG = "E_TAKING_PICTURE_FAILED";
  private Promise mPromise;
  private byte[] mImageData;
  private Bitmap mBitmap;
  private ReadableMap mOptions;
  private File mDirectory;
  private PictureSavedDelegate mPictureSavedDelegate;

  public ResolveTakenPictureAsyncTask(byte[] imageData, Promise promise, ReadableMap options,
                                      File directory, PictureSavedDelegate delegate) {
    mPromise = promise;
    mOptions = options;
    mImageData = imageData;
    mDirectory = directory;
    mPictureSavedDelegate = delegate;
  }

  public ResolveTakenPictureAsyncTask(Bitmap bitmap, Promise promise, ReadableMap options,
                                      File directory, PictureSavedDelegate delegate) {
    mPromise = promise;
    mBitmap = bitmap;
    mOptions = options;
    mDirectory = directory;
    mPictureSavedDelegate = delegate;
  }

  private int getQuality() {
    return (int) (mOptions.getDouble("quality") * 100);
  }

  @Override
  protected WritableMap doInBackground(Void... voids) {
    WritableMap response = Arguments.createMap();
    ByteArrayInputStream inputStream = null;

    // we need the stream only for photos from a device
    if (mBitmap == null) {
      mBitmap = BitmapFactory.decodeByteArray(mImageData, 0, mImageData.length);
      inputStream = new ByteArrayInputStream(mImageData);
    }

    try {
      if (inputStream != null) {
        ExifInterface exifInterface = new ExifInterface(inputStream);
        // Get orientation of the image from mImageData via inputStream
        int orientation = exifInterface.getAttributeInt(
            ExifInterface.TAG_ORIENTATION,
            ExifInterface.ORIENTATION_UNDEFINED
        );

        // Rotate the bitmap to the proper orientation if needed
        if (orientation != ExifInterface.ORIENTATION_UNDEFINED) {
          mBitmap = rotateBitmap(mBitmap, getImageRotation(orientation));
        }

        // Write Exif data to the response if requested
        if (mOptions.hasKey("exif") && mOptions.getBoolean("exif")) {
          WritableMap exifData = ExpoCameraViewHelper.getExifData(exifInterface);
          response.putMap("exif", exifData);
        }
      }

      // Upon rotating, write the image's dimensions to the response
      response.putInt("width", mBitmap.getWidth());
      response.putInt("height", mBitmap.getHeight());

      // Cache compressed image in imageStream
      ByteArrayOutputStream imageStream = new ByteArrayOutputStream();
      mBitmap.compress(Bitmap.CompressFormat.JPEG, getQuality(), imageStream);

      // Write compressed image to file in cache directory
      String filePath = writeStreamToFile(imageStream);
      File imageFile = new File(filePath);
      String fileUri = Uri.fromFile(imageFile).toString();
      response.putString("uri", fileUri);

      // Write base64-encoded image to the response if requested
      if (mOptions.hasKey("base64") && mOptions.getBoolean("base64")) {
        response.putString("base64", Base64.encodeToString(imageStream.toByteArray(), Base64.DEFAULT));
      }

      // Cleanup
      imageStream.close();
      if (inputStream != null) {
        inputStream.close();
        inputStream = null;
      }

      return response;
    } catch (Resources.NotFoundException e) {
      mPromise.reject(ERROR_TAG, "Documents directory of the app could not be found.", e);
      e.printStackTrace();
    } catch (IOException e) {
      mPromise.reject(ERROR_TAG, "An unknown I/O exception has occurred.", e);
      e.printStackTrace();
    } finally {
      try {
        if (inputStream != null) {
          inputStream.close();
        }
      } catch (IOException e) {
        e.printStackTrace();
      }
    }

    // An exception had to occur, promise has already been rejected. Do not try to resolve it again.
    return null;
  }

  @Override
  protected void onPostExecute(WritableMap response) {
    super.onPostExecute(response);

    if (response != null) {
      if (mOptions.hasKey("fastMode") && mOptions.getBoolean("fastMode")) {
        WritableMap wrapper = Arguments.createMap();
        wrapper.putInt("id", mOptions.getInt("id"));
        wrapper.putMap("data", response);
        mPictureSavedDelegate.onPictureSaved(wrapper);
      } else {
        mPromise.resolve(response);
      }
    }
  }

  // Write stream to file in cache directory
  private String writeStreamToFile(ByteArrayOutputStream inputStream) throws IOException {
    String outputPath = null;
    IOException exception = null;
    FileOutputStream outputStream = null;

    try {
      outputPath = ExpFileUtils.generateOutputPath(mDirectory, "Camera", ".jpg");
      outputStream = new FileOutputStream(outputPath);
      inputStream.writeTo(outputStream);
    } catch (IOException e) {
      e.printStackTrace();
      exception = e;
    } finally {
      try {
        if (outputStream != null) {
          outputStream.close();
        }
      } catch (IOException e) {
        e.printStackTrace();
      }
    }

    if (exception != null) {
      throw exception;
    }

    return outputPath;
  }

  private Bitmap rotateBitmap(Bitmap source, int angle) {
    Matrix matrix = new Matrix();
    matrix.postRotate(angle);
    return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
  }

  // Get rotation degrees from Exif orientation enum
  private int getImageRotation(int orientation) {
    int rotationDegrees = 0;
    switch (orientation) {
      case ExifInterface.ORIENTATION_ROTATE_90:
        rotationDegrees = 90;
        break;
      case ExifInterface.ORIENTATION_ROTATE_180:
        rotationDegrees = 180;
        break;
      case ExifInterface.ORIENTATION_ROTATE_270:
        rotationDegrees = 270;
        break;
    }
    return rotationDegrees;
  }
}
