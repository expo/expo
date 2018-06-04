package abi28_0_0.host.exp.exponent.modules.api.components.barcodescanner;

import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.google.android.gms.vision.barcode.Barcode;

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
