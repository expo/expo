package abi43_0_0.expo.modules.camera.tasks;

import abi43_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerResult;

public interface BarCodeScannerAsyncTaskDelegate {
  void onBarCodeScanned(BarCodeScannerResult barCode);
  void onBarCodeScanningTaskCompleted();
}
