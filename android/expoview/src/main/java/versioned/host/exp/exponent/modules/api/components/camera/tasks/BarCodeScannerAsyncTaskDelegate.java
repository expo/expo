package versioned.host.exp.exponent.modules.api.components.camera.tasks;

import com.google.android.gms.vision.barcode.Barcode;

public interface BarCodeScannerAsyncTaskDelegate {
  void onBarCodeRead(Barcode barCode);
  void onBarCodeScanningTaskCompleted();
}
