package abi25_0_0.host.exp.exponent.modules.api.components.camera.tasks;

import abi25_0_0.host.exp.exponent.modules.api.components.camera.utils.ExpoBarCodeDetector;

public interface BarCodeScannerAsyncTaskDelegate {
  void onBarCodeRead(ExpoBarCodeDetector.Result barCode);
  void onBarCodeScanningTaskCompleted();
}
