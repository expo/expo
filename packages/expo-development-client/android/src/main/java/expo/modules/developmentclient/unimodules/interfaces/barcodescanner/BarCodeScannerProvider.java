package expo.modules.developmentclient.unimodules.interfaces.barcodescanner;

import android.content.Context;

import java.util.List;

public interface BarCodeScannerProvider {
  BarCodeScanner createBarCodeDetectorWithContext(Context context);
}
