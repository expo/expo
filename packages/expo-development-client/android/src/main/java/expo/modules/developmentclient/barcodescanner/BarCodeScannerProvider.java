package expo.modules.developmentclient.barcodescanner;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.developmentclient.unimodules.core.interfaces.InternalModule;
import expo.modules.developmentclient.unimodules.interfaces.barcodescanner.BarCodeScanner;
import expo.modules.developmentclient.barcodescanner.scanners.ExpoBarCodeScanner;
import expo.modules.developmentclient.barcodescanner.scanners.GMVBarCodeScanner;
//import expo.modules.developmentclient.barcodescanner.scanners.ZxingBarCodeScanner;

public class BarCodeScannerProvider implements InternalModule, expo.modules.developmentclient.unimodules.interfaces.barcodescanner.BarCodeScannerProvider {

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) expo.modules.developmentclient.unimodules.interfaces.barcodescanner.BarCodeScannerProvider.class);
  }

  @Override
  public BarCodeScanner createBarCodeDetectorWithContext(Context context) {
    ExpoBarCodeScanner detector = new GMVBarCodeScanner(context);
//    if (!detector.isAvailable()) {
//      detector = new ZxingBarCodeScanner(context);
//    }
    return detector;
  }
}
