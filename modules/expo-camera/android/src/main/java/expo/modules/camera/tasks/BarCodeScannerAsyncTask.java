package expo.modules.camera.tasks;

import expo.modules.camera.utils.ExpoBarCodeDetector;

public class BarCodeScannerAsyncTask extends android.os.AsyncTask<Void, Void, ExpoBarCodeDetector.Result> {
  private final ExpoBarCodeDetector mDetector;
  private byte[] mImageData;
  private int mWidth;
  private int mHeight;
  private int mRotation;
  private BarCodeScannerAsyncTaskDelegate mDelegate;

  public BarCodeScannerAsyncTask(
      BarCodeScannerAsyncTaskDelegate delegate,
      ExpoBarCodeDetector detector,
      byte[] imageData,
      int width,
      int height,
      int rotation
  ) {
    mImageData = imageData;
    mWidth = width;
    mHeight = height;
    mDelegate = delegate;
    mDetector = detector;
    mRotation = rotation;
  }

  @Override
  protected ExpoBarCodeDetector.Result doInBackground(Void... ignored) {
    if (isCancelled() || mDelegate == null) {
      return null;
    }

    return mDetector.detect(mImageData, mWidth, mHeight, mRotation);
  }

  @Override
  protected void onPostExecute(ExpoBarCodeDetector.Result result) {
    super.onPostExecute(result);
    if (result != null) {
      mDelegate.onBarCodeRead(result);
    }
    mDelegate.onBarCodeScanningTaskCompleted();
  }
}
