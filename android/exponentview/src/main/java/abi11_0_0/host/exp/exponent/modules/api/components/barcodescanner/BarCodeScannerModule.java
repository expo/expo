package abi11_0_0.host.exp.exponent.modules.api.components.barcodescanner;

import android.view.Surface;

import abi11_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi11_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;

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
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("aztec", "aztec");
            put("ean13", "ean13");
            put("ean8","ean8");
            put("qr","qr");
            put("pdf417","pdf417");
            put("upce","upce");
            put("datamatrix","datamatrix");
            put("code39","code39");
            put("code93","code93");
            put("interleaved2of5","interleaved2of5");
            put("codabar","codabar");
            put("code128","code128");
            put("maxicode","maxicode");
            put("rss14","rss14");
            put("rssexpanded","rssexpanded");
            put("upca","upca");
            put("upceanextension","upceanextension");
          }
        });
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
