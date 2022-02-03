package expo.modules.interfaces.barcodescanner;

import android.content.Context;

public interface BarCodeScannerProviderInterface {
  BarCodeScannerInterface createBarCodeDetectorWithContext(Context context);
}
