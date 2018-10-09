package expo.modules.barcodescanner.scanners;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.util.Log;
import android.util.SparseArray;

import com.google.android.gms.vision.Frame;
import com.google.android.gms.vision.barcode.Barcode;
import com.google.android.gms.vision.barcode.BarcodeDetector;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import expo.interfaces.barcodescanner.BarCodeScannerResult;
import expo.interfaces.barcodescanner.BarCodeScannerSettings;
import expo.modules.barcodescanner.utils.FrameFactory;

public class GMVBarCodeScanner extends ExpoBarCodeScanner {

  private String TAG = GMVBarCodeScanner.class.getSimpleName();

  private BarcodeDetector mBarcodeDetector;

  public GMVBarCodeScanner(Context context) {
    super(context);
    mBarcodeDetector = new BarcodeDetector.Builder(mContext)
        .setBarcodeFormats(0)
        .build();
  }

  @Override
  public BarCodeScannerResult scan(byte[] data, int width, int height, int rotation) {
    List<BarCodeScannerResult> results = scan(FrameFactory.buildFrame(data, width, height, rotation).getFrame());
    return results.size() > 0 ? results.get(0) : null;
  }

  @Override
  public List<BarCodeScannerResult> scanMultiple(Bitmap bitmap) {
    return scan(FrameFactory.buildFrame(bitmap).getFrame());
  }

  private List<BarCodeScannerResult> scan(Frame frame) {
    try {
      SparseArray<Barcode> result = mBarcodeDetector.detect(frame);
      List<BarCodeScannerResult> results = new ArrayList<>();

      for (int i = 0; i < result.size(); i++) {
        Barcode barcode = result.get(result.keyAt(i));
        results.add(new BarCodeScannerResult(barcode.format, barcode.rawValue));
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
  public void setSettings(BarCodeScannerSettings settings) {
    List<Integer> newBarCodeTypes = parseBarCodeTypesFromSettings(settings);
    if (areNewAndOldBarCodeTypesEqual(newBarCodeTypes)) {
      return;
    }

    int barcodeFormats = 0;
    for (Integer code : newBarCodeTypes) {
      barcodeFormats = barcodeFormats | code;
    }

    mBarCodeTypes = newBarCodeTypes;
    mBarcodeDetector = new BarcodeDetector.Builder(mContext)
        .setBarcodeFormats(barcodeFormats)
        .build();
  }

  @Override
  public boolean isAvailable() {
    return mBarcodeDetector.isOperational();
  }
}
