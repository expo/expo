package abi31_0_0.expo.interfaces.barcodescanner;

import android.content.Context;

import java.util.List;

public interface BarCodeScannerProvider {
  BarCodeScanner createBarCodeDetectorWithContext(Context context);
}
