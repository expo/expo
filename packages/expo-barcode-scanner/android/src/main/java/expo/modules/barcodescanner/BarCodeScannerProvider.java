package expo.modules.barcodescanner;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;
import expo.modules.barcodescanner.scanners.ExpoBarCodeScanner;
import expo.modules.barcodescanner.scanners.GMVBarCodeScanner;
import expo.modules.barcodescanner.scanners.ZxingBarCodeScanner;
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface;
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface;

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
