package expo.modules.camera.utils;

import android.content.Context;

import java.util.List;

public class BarCodeDetectorUtils {
  /**
   * Initialize the barcode decoder.
   * Supports all iOS codes except [code138, code39mod43, interleaved2of5]
   * Additionally supports [codabar, code128, upc_a]
   */
  public static ExpoBarCodeDetector initBarcodeReader(List<Integer> barCodeTypes, Context context) {
    ExpoBarCodeDetector detector = new GMVBarCodeDetector(barCodeTypes, context);
    if (!detector.isAvailable()) {
      detector = new ZxingBarCodeDetector(barCodeTypes, context);
    }

    return detector;
  }
}
