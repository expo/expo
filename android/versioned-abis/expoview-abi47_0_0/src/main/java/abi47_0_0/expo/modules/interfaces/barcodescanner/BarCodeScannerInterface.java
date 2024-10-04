package abi47_0_0.expo.modules.interfaces.barcodescanner;

import android.graphics.Bitmap;

import java.util.List;

public interface BarCodeScannerInterface {
  BarCodeScannerResult scan(byte[] imageData, int width, int height, int rotation);
  List<BarCodeScannerResult> scanMultiple(Bitmap bitmap);
  void setSettings(BarCodeScannerSettings settings);
}
