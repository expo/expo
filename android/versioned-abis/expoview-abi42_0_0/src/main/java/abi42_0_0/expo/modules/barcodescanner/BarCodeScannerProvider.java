package abi42_0_0.expo.modules.barcodescanner;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.interfaces.InternalModule;
import abi42_0_0.expo.modules.barcodescanner.scanners.ExpoBarCodeScanner;
import abi42_0_0.expo.modules.barcodescanner.scanners.GMVBarCodeScanner;
import abi42_0_0.expo.modules.barcodescanner.scanners.ZxingBarCodeScanner;
import abi42_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerInterface;
import abi42_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface;

public class BarCodeScannerProvider implements InternalModule, BarCodeScannerProviderInterface {

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList(BarCodeScannerProviderInterface.class);
  }

  @Override
  public BarCodeScannerInterface createBarCodeDetectorWithContext(Context context) {
    ExpoBarCodeScanner detector = new GMVBarCodeScanner(context);
    if (!detector.isAvailable()) {
      detector = new ZxingBarCodeScanner(context);
    }
    return detector;
  }
}
