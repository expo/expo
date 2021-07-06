package expo.modules.camera.tasks;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.os.Bundle;

import androidx.exifinterface.media.ExifInterface;

import android.net.Uri;
import android.os.AsyncTask;
import android.util.Base64;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;

import org.unimodules.core.Promise;

import expo.modules.camera.CameraViewHelper;
import expo.modules.camera.utils.FileSystemUtils;

public class ResolveTakenPictureAsyncTask extends AsyncTask<Void, Void, Bundle> {
  private static final String DIRECTORY_NOT_FOUND_MSG = "Documents directory of the app could not be found.";
  private static final String UNKNOWN_IO_EXCEPTION_MSG = "An unknown I/O exception has occurred.";
  private static final String UNKNOWN_EXCEPTION_MSG = "An unknown exception has occurred.";

  private static final String ERROR_TAG = "E_TAKING_PICTURE_FAILED";

  private static final String DIRECTORY_NAME = "Camera";
  private static final String EXTENSION = ".jpg";

  private static final String SKIP_PROCESSING_KEY = "skipProcessing";
  private static final String FAST_MODE_KEY = "fastMode";
  private static final String QUALITY_KEY = "quality";
  private static final String BASE64_KEY = "base64";
  private static final String HEIGHT_KEY = "height";
  private static final String WIDTH_KEY = "width";
  private static final String EXIF_KEY = "exif";
  private static final String DATA_KEY = "data";
  private static final String URI_KEY = "uri";
  private static final String ID_KEY = "id";

  private static final int DEFAULT_QUALITY = 1;

  private Promise mPromise;
  private byte[] mImageData;
  private Bitmap mBitmap;
  private Map<String, Object> mOptions;
  private File mDirectory;
  private PictureSavedDelegate mPictureSavedDelegate;

  public ResolveTakenPictureAsyncTask(byte[] imageData, Promise promise, Map<String, Object> options, File directory, PictureSavedDelegate delegate) {
    mPromise = promise;
    mOptions = options;
    mImageData = imageData;
    mDirectory = directory;
    mPictureSavedDelegate = delegate;
  }

  public ResolveTakenPictureAsyncTask(Bitmap bitmap, Promise promise, Map<String, Object> options, File directory, PictureSavedDelegate delegate) {
    mPromise = promise;
    mBitmap = bitmap;
    mOptions = options;
    mDirectory = directory;
    mPictureSavedDelegate = delegate;
  }

  private int getQuality() {
    if (mOptions.get(QUALITY_KEY) instanceof Number) {
      double requestedQuality = ((Number) mOptions.get(QUALITY_KEY)).doubleValue();
      return (int) (requestedQuality * 100);
    }

    return DEFAULT_QUALITY * 100;
  }

  @Override
  protected Bundle doInBackground(Void... voids) {
    // handle SkipProcessing
    if (mImageData != null && isOptionEnabled(SKIP_PROCESSING_KEY)) {
      return handleSkipProcessing();
    }

    Bundle response = new Bundle();

    if (mBitmap == null) {
      mBitmap = BitmapFactory.decodeByteArray(mImageData, 0, mImageData.length);
    }

    ByteArrayInputStream inputStream = new ByteArrayInputStream(mImageData);

    try {
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
      if (isOptionEnabled(EXIF_KEY)) {
        Bundle exifData = CameraViewHelper.getExifData(exifInterface);
        response.putBundle(EXIF_KEY, exifData);
      }

      // Upon rotating, write the image's dimensions to the response
      response.putInt(WIDTH_KEY, mBitmap.getWidth());
      response.putInt(HEIGHT_KEY, mBitmap.getHeight());

      // Cache compressed image in imageStream
      ByteArrayOutputStream imageStream = new ByteArrayOutputStream();
      mBitmap.compress(Bitmap.CompressFormat.JPEG, getQuality(), imageStream);
      // Write compressed image to file in cache directory
      String filePath = writeStreamToFile(imageStream);

      // Save Exif data to the image if requested
      if (isOptionEnabled(EXIF_KEY)) {
        ExifInterface exifFromFile = new ExifInterface(filePath);
        CameraViewHelper.addExifData(exifFromFile, exifInterface);
      }

      File imageFile = new File(filePath);
      String fileUri = Uri.fromFile(imageFile).toString();
      response.putString(URI_KEY, fileUri);

      // Write base64-encoded image to the response if requested
      if (isOptionEnabled(BASE64_KEY)) {
        response.putString(BASE64_KEY, Base64.encodeToString(imageStream.toByteArray(), Base64.NO_WRAP));
      }

      // Cleanup
      imageStream.close();
      inputStream.close();
      inputStream = null;

      return response;
    } catch (Resources.NotFoundException e) {
      mPromise.reject(ERROR_TAG, DIRECTORY_NOT_FOUND_MSG, e);
      e.printStackTrace();
    } catch (IOException e) {
      mPromise.reject(ERROR_TAG, UNKNOWN_IO_EXCEPTION_MSG, e);
      e.printStackTrace();
    } catch (Exception e) {
      mPromise.reject(ERROR_TAG, UNKNOWN_EXCEPTION_MSG, e);
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

  private Bundle handleSkipProcessing() {
    Bundle response = new Bundle();
    try {
      // save byte array (it's already a JPEG)
      ByteArrayOutputStream imageStream = new ByteArrayOutputStream();
      imageStream.write(mImageData);

      // write compressed image to file in cache directory
      String filePath = writeStreamToFile(imageStream);
      File imageFile = new File(filePath);

      // handle image uri
      String fileUri = Uri.fromFile(imageFile).toString();
      response.putString(URI_KEY, fileUri);

      // read exif information
      ExifInterface exifInterface = new ExifInterface(filePath);

      // handle image dimensions
      response.putInt(WIDTH_KEY, exifInterface.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, -1));
      response.putInt(HEIGHT_KEY, exifInterface.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, -1));

      // handle exif request
      if (isOptionEnabled(EXIF_KEY)) {
        Bundle exifData = CameraViewHelper.getExifData(exifInterface);
        response.putBundle(EXIF_KEY, exifData);
      }

      // handle base64
      if (isOptionEnabled(BASE64_KEY)) {
        response.putString(BASE64_KEY, Base64.encodeToString(mImageData, Base64.NO_WRAP));
      }

      return response;
    } catch (IOException e) {
      mPromise.reject(ERROR_TAG, UNKNOWN_IO_EXCEPTION_MSG, e);
      e.printStackTrace();
    } catch (Exception e) {
      mPromise.reject(ERROR_TAG, UNKNOWN_EXCEPTION_MSG, e);
      e.printStackTrace();
    }
    // error occurred
    return null;
  }

  @Override
  protected void onPostExecute(Bundle response) {
    super.onPostExecute(response);

    // If the response is not null everything went well and we can resolve the promise.
    if (response != null) {
      if (isOptionEnabled(FAST_MODE_KEY)) {
        Bundle wrapper = new Bundle();
        wrapper.putInt(ID_KEY, ((Double) mOptions.get(ID_KEY)).intValue());
        wrapper.putBundle(DATA_KEY, response);
        mPictureSavedDelegate.onPictureSaved(wrapper);
      } else {
        mPromise.resolve(response);
      }
    }
  }

  // Write stream to file in cache directory
  private String writeStreamToFile(ByteArrayOutputStream inputStream) throws Exception {
    String outputPath = null;
    Exception exception = null;
    FileOutputStream outputStream = null;

    try {
      outputPath = FileSystemUtils.generateOutputPath(mDirectory, DIRECTORY_NAME, EXTENSION);
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

  private boolean isOptionEnabled(String key) {
    return mOptions.get(key) != null && (Boolean) mOptions.get(key);
  }
}
