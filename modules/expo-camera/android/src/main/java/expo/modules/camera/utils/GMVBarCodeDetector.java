package expo.modules.camera.utils;

import android.content.Context;
import android.graphics.Bitmap;
import android.util.Log;
import android.util.SparseArray;

import com.google.android.gms.vision.Frame;
import com.google.android.gms.vision.barcode.Barcode;
import com.google.android.gms.vision.barcode.BarcodeDetector;

import java.util.ArrayList;
import java.util.Collections;
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
  public List<Result> detectMultiple(Bitmap bitmap) {
    return detect(ExpoFrameFactory.buildFrame(bitmap).getFrame());
  }

  @Override
  public Result detect(byte[] data, int width, int height, int rotation) {
    List<Result> results = detect(ExpoFrameFactory.buildFrame(data, width, height, 0).getFrame());
    return results.size() > 0 ? results.get(0) : null;
  }

  private List<Result> detect(Frame frame) {
    try {
      SparseArray<Barcode> result = mBarcodeDetector.detect(frame);
      List<Result> results = new ArrayList<>();

      for(int i = 0; i < result.size(); i++) {
        Barcode barcode = result.get(result.keyAt(i));
        results.add(new Result(barcode.format, barcode.rawValue));
      }

      return results;
    } catch (Exception e) {
      // for some reason, sometimes the very first preview frame the camera passes back to us
      // doesn't have the correct amount of data (data.length is too small for the height and width)
      // which throws, so we just return an empty list
      // subsequent frames are all the correct length & don't seem to throw
      Log.e(TAG, "Failed to detect barcode: " + e.getMessage());
      return Collections.emptyList();
    }
  }

  @Override
  public boolean isAvailable() {
    return mBarcodeDetector.isOperational();
  }
}
