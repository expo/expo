package expo.modules.barcodescanner;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Bundle;

import com.google.android.gms.vision.barcode.Barcode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.interfaces.barcodescanner.BarCodeScanner;
import expo.interfaces.barcodescanner.BarCodeScannerResult;
import expo.interfaces.barcodescanner.BarCodeScannerSettings;
import expo.interfaces.imageloader.ImageLoader;

import static expo.modules.barcodescanner.ExpoBarCodeScanner.CAMERA_TYPE_BACK;
import static expo.modules.barcodescanner.ExpoBarCodeScanner.CAMERA_TYPE_FRONT;

public class BarCodeScannerModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoBarCodeScannerModule";
  private static final String ERROR_TAG = "E_BARCODE_SCANNER";
  private final BarCodeScannerProvider mBarCodeScannerProvider;
  private ModuleRegistry mModuleRegistry;

  private static final Map<String, Object> VALID_BARCODE_TYPES =
      Collections.unmodifiableMap(new HashMap<String, Object>() {
        {
          put("aztec", Barcode.AZTEC);
          put("ean13", Barcode.EAN_13);
          put("ean8", Barcode.EAN_8);
          put("qr", Barcode.QR_CODE);
          put("pdf417", Barcode.PDF417);
          put("upc_e", Barcode.UPC_E);
          put("datamatrix", Barcode.DATA_MATRIX);
          put("code39", Barcode.CODE_39);
          put("code93", Barcode.CODE_93);
          put("itf14", Barcode.ITF);
          put("codabar", Barcode.CODABAR);
          put("code128", Barcode.CODE_128);
          put("upc_a", Barcode.UPC_A);
        }
      });

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  public BarCodeScannerModule(Context context) {
    super(context);
    mBarCodeScannerProvider = new BarCodeScannerProvider();
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("BarCodeType", getBarCodeConstants());
        put("Type", getTypeConstants());
      }

      private Map<String, Object> getBarCodeConstants() {
        return VALID_BARCODE_TYPES;
      }

      private Map<String, Object> getTypeConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("front", CAMERA_TYPE_FRONT);
            put("back", CAMERA_TYPE_BACK);
          }
        });
      }
    });
  }

  @ExpoMethod
  public void scanFromURLAsync(final String url, final List<Double> barCodeTypes, final Promise promise) {
    final List<Integer> types = new ArrayList<>();
    if (barCodeTypes != null) {
      for (int i = 0; i < barCodeTypes.size(); i++) {
        types.add(barCodeTypes.get(i).intValue());
      }
    }

    final ImageLoader imageLoader = mModuleRegistry.getModule(ImageLoader.class);
    imageLoader.loadImageFromURL(url, new ImageLoader.ResultListener() {
      @Override
      public void onSuccess(Bitmap bitmap) {
        BarCodeScanner scanner = mBarCodeScannerProvider.createBarCodeDetectorWithContext(getContext());
        scanner.setSettings(new BarCodeScannerSettings() {{
          putTypes(types);
        }});
        List<BarCodeScannerResult> results = scanner.scanMultiple(bitmap);

        List<Bundle> resultList = new ArrayList<>();
        for (BarCodeScannerResult result : results) {
          Bundle bundle = new Bundle();
          bundle.putString("data", result.getValue());
          bundle.putInt("type", result.getType());
          resultList.add(bundle);
        }
        promise.resolve(resultList);
      }

      @Override
      public void onFailure(Throwable cause) {
        promise.reject(ERROR_TAG + "_IMAGE_RETRIEVAL_ERROR", "Could not get the image from given url: '" + url + "'", cause);
      }
    });
  }
}
