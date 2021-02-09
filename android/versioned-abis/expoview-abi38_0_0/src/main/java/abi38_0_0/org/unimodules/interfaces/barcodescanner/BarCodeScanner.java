package abi38_0_0.org.unimodules.interfaces.barcodescanner;

import android.graphics.Bitmap;

import java.util.List;

public interface BarCodeScanner {
  BarCodeScannerResult scan(byte[] imageData, int width, int height, int rotation);
  List<BarCodeScannerResult> scanMultiple(Bitmap bitmap);
  void setSettings(BarCodeScannerSettings settings);
}
