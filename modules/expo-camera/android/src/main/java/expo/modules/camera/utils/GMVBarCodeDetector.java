package expo.modules.camera.utils;

import android.content.Context;
import android.util.Log;
import android.util.SparseArray;

import com.google.android.gms.vision.barcode.Barcode;
import com.google.android.gms.vision.barcode.BarcodeDetector;

import java.util.List;

public class GMVBarCodeDetector extends ExpoBarCodeDetector {

  private String TAG = GMVBarCodeDetector.class.getSimpleName();

  private BarcodeDetector mBarcodeDetector;

  public GMVBarCodeDetector(List<Integer> barCodeTypes, Context context) {
    super(barCodeTypes, context);
    int barcodeFormats = 0;
    if (mBarCodeTypes != null) {
      for (Integer code : mBarCodeTypes) {
        barcodeFormats = barcodeFormats | code;
      }
    }
    mBarcodeDetector = new BarcodeDetector.Builder(mContext)
      .setBarcodeFormats(barcodeFormats).build();
  }

  @Override
  public Result detect(byte[] data, int width, int height, int rotation) {
    try {
      SparseArray<Barcode> result = mBarcodeDetector.detect(ExpoFrameFactory.buildFrame(data, width, height, 0).getFrame());
      if (result.size() > 0) {
        Barcode barcode = result.valueAt(0);
        return new Result(barcode.format, barcode.rawValue);
      } else {
        return null;
      }
    } catch (Exception e) {
      // for some reason, sometimes the very first preview frame the camera passes back to us
      // doesn't have the correct amount of data (data.length is too small for the height and width)
      // which throws, so we just return null
      // subsequent frames are all the correct length & don't seem to throw
      Log.e(TAG, "Failed to detect barcode: " + e.getMessage());
      return null;
    }
  }

  @Override
  public boolean isAvailable() {
    return mBarcodeDetector.isOperational();
  }
}
