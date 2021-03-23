package abi41_0_0.expo.modules.camera.tasks;

import abi41_0_0.org.unimodules.interfaces.barcodescanner.BarCodeScannerResult;

public interface BarCodeScannerAsyncTaskDelegate {
  void onBarCodeScanned(BarCodeScannerResult barCode);
  void onBarCodeScanningTaskCompleted();
}
