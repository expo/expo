package abi39_0_0.org.unimodules.interfaces.barcodescanner;

import android.content.Context;

import java.util.List;

public interface BarCodeScannerProvider {
  BarCodeScanner createBarCodeDetectorWithContext(Context context);
}
