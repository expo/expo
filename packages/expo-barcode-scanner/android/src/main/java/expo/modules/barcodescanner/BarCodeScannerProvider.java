package expo.modules.barcodescanner;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.interfaces.barcodescanner.BarCodeScanner;
import expo.modules.barcodescanner.scanners.ExpoBarCodeScanner;
import expo.modules.barcodescanner.scanners.GMVBarCodeScanner;
import expo.modules.barcodescanner.scanners.ZxingBarCodeScanner;

public class BarCodeScannerProvider implements InternalModule, org.unimodules.interfaces.barcodescanner.BarCodeScannerProvider {

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) org.unimodules.interfaces.barcodescanner.BarCodeScannerProvider.class);
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
