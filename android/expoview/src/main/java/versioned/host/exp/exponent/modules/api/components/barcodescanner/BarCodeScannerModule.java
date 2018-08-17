package versioned.host.exp.exponent.modules.api.components.barcodescanner;

import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.os.Bundle;

import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.core.ImagePipeline;
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.react.bridge.*;
import com.google.android.gms.vision.barcode.Barcode;
import expo.modules.camera.utils.BarCodeDetectorUtils;
import expo.modules.camera.utils.ExpoBarCodeDetector;

import java.util.*;

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

  @ReactMethod
  public void readBarCodeFromURL(String url, final ReadableArray barCodeTypes, final Promise promise) {
    final List<Integer> types = new ArrayList<>();
    if (barCodeTypes != null) {
      for (int i = 0; i < barCodeTypes.size(); i++) {
        types.add(barCodeTypes.getInt(i));
      }
    }

    ImageRequest imageRequest = ImageRequest.fromUri(url);

    ImagePipeline imagePipeline = Fresco.getImagePipeline();
    DataSource<CloseableReference<CloseableImage>> dataSource =
        imagePipeline.fetchDecodedImage(imageRequest, getReactApplicationContext());

    dataSource.subscribe(
        new BaseBitmapDataSubscriber() {
          @Override
          public void onNewResultImpl(@Nullable Bitmap bitmap) {
            if (bitmap == null) {
              promise.reject(
                  "E_IMAGE_RETRIEVAL_ERROR",
                  "Could not get the image",
                  new Exception("Loaded bitmap is null"));
              return;
            }

            ExpoBarCodeDetector detector = BarCodeDetectorUtils.initBarcodeReader(
                types,
                getReactApplicationContext());
            List<ExpoBarCodeDetector.Result> results = detector.detectMultiple(bitmap);

            WritableArray resultList = Arguments.createArray();
            for (ExpoBarCodeDetector.Result result : results) {
              WritableMap resultMap = Arguments.createMap();
              resultMap.putString("data", result.getValue());
              resultMap.putInt("type", result.getType());
              resultList.pushMap(resultMap);
            }
            promise.resolve(resultList);
          }

          @Override
          public void onFailureImpl(DataSource dataSource) {
            promise.reject(
                "E_IMAGE_RETRIEVAL_ERROR",
                "Could not get the image",
                dataSource.getFailureCause());
          }
        },
        AsyncTask.THREAD_POOL_EXECUTOR);
  }
}
