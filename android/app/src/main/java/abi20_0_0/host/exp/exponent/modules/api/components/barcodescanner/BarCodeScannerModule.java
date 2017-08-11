package abi20_0_0.host.exp.exponent.modules.api.components.barcodescanner;

import android.view.Surface;

import abi20_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi20_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.google.zxing.BarcodeFormat;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class BarCodeScannerModule extends ReactContextBaseJavaModule {
  private static final String TAG = "BarCodeScannerModule";

  public static final int RCT_CAMERA_FLASH_MODE_OFF = 0;
  public static final int RCT_CAMERA_FLASH_MODE_ON = 1;
  public static final int RCT_CAMERA_FLASH_MODE_AUTO = 2;
  public static final int RCT_CAMERA_TYPE_FRONT = 1;
  public static final int RCT_CAMERA_TYPE_BACK = 2;
  public static final int RCT_CAMERA_TORCH_MODE_OFF = 0;
  public static final int RCT_CAMERA_TORCH_MODE_ON = 1;
  public static final int RCT_CAMERA_TORCH_MODE_AUTO = 2;
  public static final Map<String, Object> VALID_BARCODE_TYPES =
      Collections.unmodifiableMap(new HashMap<String, Object>() {
    {
      put("aztec", BarcodeFormat.AZTEC.toString());
      put("ean13", BarcodeFormat.EAN_13.toString());
      put("ean8", BarcodeFormat.EAN_8.toString());
      put("qr", BarcodeFormat.QR_CODE.toString());
      put("pdf417", BarcodeFormat.PDF_417.toString());
      put("upc_e", BarcodeFormat.UPC_E.toString());
      put("datamatrix", BarcodeFormat.DATA_MATRIX.toString());
      put("code39", BarcodeFormat.CODE_39.toString());
      put("code93", BarcodeFormat.CODE_93.toString());
      put("interleaved2of5", BarcodeFormat.ITF.toString());
      put("codabar", BarcodeFormat.CODABAR.toString());
      put("code128", BarcodeFormat.CODE_128.toString());
      put("maxicode", BarcodeFormat.MAXICODE.toString());
      put("rss14", BarcodeFormat.RSS_14.toString());
      put("rssexpanded", BarcodeFormat.RSS_EXPANDED.toString());
      put("upc_a", BarcodeFormat.UPC_A.toString());
      put("upc_ean", BarcodeFormat.UPC_EAN_EXTENSION.toString());
    }
  });

  private static ReactApplicationContext mReactContext;

  public BarCodeScannerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mReactContext = reactContext;
  }

  public static ReactApplicationContext getReactContextSingleton() {
    return mReactContext;
  }

  @Override
  public String getName() {
    return "ExponentBarCodeScannerModule";
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("BarCodeType", getBarCodeConstants());
        put("Type", getTypeConstants());
        put("TorchMode", getTorchModeConstants());
      }

      private Map<String, Object> getBarCodeConstants() {
        return VALID_BARCODE_TYPES;
      }

      private Map<String, Object> getTypeConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("front", RCT_CAMERA_TYPE_FRONT);
            put("back", RCT_CAMERA_TYPE_BACK);
          }
        });
      }

      private Map<String, Object> getTorchModeConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("off", RCT_CAMERA_TORCH_MODE_OFF);
            put("on", RCT_CAMERA_TORCH_MODE_ON);
            put("auto", RCT_CAMERA_TORCH_MODE_AUTO);
          }
        });
      }
    });
  }
}
