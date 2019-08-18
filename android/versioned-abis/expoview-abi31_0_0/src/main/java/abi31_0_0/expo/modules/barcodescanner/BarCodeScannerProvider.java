package abi31_0_0.expo.modules.barcodescanner;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi31_0_0.expo.core.interfaces.InternalModule;
import abi31_0_0.expo.interfaces.barcodescanner.BarCodeScanner;
import abi31_0_0.expo.modules.barcodescanner.scanners.ExpoBarCodeScanner;
import abi31_0_0.expo.modules.barcodescanner.scanners.GMVBarCodeScanner;
import abi31_0_0.expo.modules.barcodescanner.scanners.ZxingBarCodeScanner;

public class BarCodeScannerProvider implements InternalModule, abi31_0_0.expo.interfaces.barcodescanner.BarCodeScannerProvider {

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) abi31_0_0.expo.interfaces.barcodescanner.BarCodeScannerProvider.class);
  }

  @Override
  public BarCodeScanner createBarCodeDetectorWithContext(Context context) {
    ExpoBarCodeScanner detector = new GMVBarCodeScanner(context);
    if (!detector.isAvailable()) {
      detector = new ZxingBarCodeScanner(context);
    }
    return detector;
  }
}
