package abi25_0_0.host.exp.exponent.modules.api.components.camera.utils;

import android.content.Context;
import android.util.SparseArray;

import com.google.android.gms.vision.barcode.Barcode;
import com.google.android.gms.vision.barcode.BarcodeDetector;

import java.util.List;

import abi25_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFrameFactory;

public class GMVBarCodeDetector extends ExpoBarCodeDetector {

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
    SparseArray<Barcode> result = mBarcodeDetector.detect(ExpoFrameFactory.buildFrame(data, width, height, 0).getFrame());
    if (result.size() > 0) {
      Barcode barcode = result.valueAt(0);
      return new Result(barcode.format, barcode.rawValue);
    } else {
      return null;
    }
  }

  @Override
  public boolean isAvailable() {
    return mBarcodeDetector.isOperational();
  }
}
