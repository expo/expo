package abi39_0_0.expo.modules.camera.tasks;

import abi39_0_0.org.unimodules.interfaces.barcodescanner.BarCodeScannerResult;

public interface BarCodeScannerAsyncTaskDelegate {
  void onBarCodeScanned(BarCodeScannerResult barCode);
  void onBarCodeScanningTaskCompleted();
}
