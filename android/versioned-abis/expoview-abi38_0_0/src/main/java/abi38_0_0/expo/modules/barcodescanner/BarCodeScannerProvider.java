package abi38_0_0.expo.modules.barcodescanner;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi38_0_0.org.unimodules.core.interfaces.InternalModule;
import abi38_0_0.org.unimodules.interfaces.barcodescanner.BarCodeScanner;
import abi38_0_0.expo.modules.barcodescanner.scanners.ExpoBarCodeScanner;
import abi38_0_0.expo.modules.barcodescanner.scanners.GMVBarCodeScanner;
import abi38_0_0.expo.modules.barcodescanner.scanners.ZxingBarCodeScanner;

public class BarCodeScannerProvider implements InternalModule, abi38_0_0.org.unimodules.interfaces.barcodescanner.BarCodeScannerProvider {

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) abi38_0_0.org.unimodules.interfaces.barcodescanner.BarCodeScannerProvider.class);
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
