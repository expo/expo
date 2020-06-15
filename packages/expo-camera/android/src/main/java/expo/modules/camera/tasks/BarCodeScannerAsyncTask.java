package expo.modules.camera.tasks;

import android.util.Pair;

import org.unimodules.core.interfaces.CodedThrowable;
import org.unimodules.interfaces.barcodescanner.BarCodeScanner;
import org.unimodules.interfaces.barcodescanner.BarCodeScannerResult;

public class BarCodeScannerAsyncTask extends android.os.AsyncTask<Void, Void, Pair<BarCodeScannerResult, CodedThrowable>> {
  private final BarCodeScanner mBarCodeScanner;
  private byte[] mImageData;
  private int mWidth;
  private int mHeight;
  private int mRotation;
  private BarCodeScannerAsyncTaskDelegate mDelegate;

  public BarCodeScannerAsyncTask(
    BarCodeScannerAsyncTaskDelegate delegate,
    BarCodeScanner barCodeScanner,
    byte[] imageData,
    int width,
    int height,
    int rotation
  ) {
    mImageData = imageData;
    mWidth = width;
    mHeight = height;
    mDelegate = delegate;
    mBarCodeScanner = barCodeScanner;
    mRotation = rotation;
  }

  @Override
  protected Pair<BarCodeScannerResult, CodedThrowable> doInBackground(Void... ignored) {
    if (isCancelled() || mDelegate == null) {
      return null;
    }

    return mBarCodeScanner.scan(mImageData, mWidth, mHeight, mRotation);
  }

  @Override
  protected void onPostExecute(Pair<BarCodeScannerResult, CodedThrowable> result) {
    super.onPostExecute(result);
    if (result != null) {
      if (result.first != null) {
        mDelegate.onBarCodeScanned(result.first);
      }
    }
    mDelegate.onBarCodeScanningTaskCompleted();
  }
}
