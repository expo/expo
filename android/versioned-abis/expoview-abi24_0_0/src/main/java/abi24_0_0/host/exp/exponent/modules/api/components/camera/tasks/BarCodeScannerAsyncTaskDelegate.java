package abi24_0_0.host.exp.exponent.modules.api.components.camera.tasks;

import com.google.zxing.Result;

public interface BarCodeScannerAsyncTaskDelegate {
  void onBarCodeRead(Result barCode);
  void onBarCodeScanningTaskCompleted();
}
