package abi28_0_0.host.exp.exponent.modules.api.components.camera;

import android.Manifest;
import android.graphics.Bitmap;
import android.os.Build;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager;
import abi28_0_0.com.facebook.react.uimanager.UIBlock;
import abi28_0_0.com.facebook.react.uimanager.UIManagerModule;
import com.google.android.cameraview.AspectRatio;
import com.google.android.cameraview.Constants;
import com.google.android.cameraview.Size;
import com.google.android.gms.vision.barcode.Barcode;

import java.io.File;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;

import javax.annotation.Nullable;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;
import host.exp.expoview.Exponent;
import abi28_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks.ResolveTakenPictureAsyncTask;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFaceDetector;

public class CameraModule extends ExpoKernelServiceConsumerBaseModule {
  private static final String TAG = "CameraModule";

  private ScopedContext mScopedContext;

  static final int VIDEO_2160P = 0;
  static final int VIDEO_1080P = 1;
  static final int VIDEO_720P = 2;
  static final int VIDEO_480P = 3;
  static final int VIDEO_4x3 = 4;

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

  public CameraModule(ReactApplicationContext reactContext, ScopedContext scopedContext,
                      ExperienceId experienceId) {
    super(reactContext, experienceId);
    mScopedContext = scopedContext;
  }

  @Override
  public String getName() {
    return "ExponentCameraModule";
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("Type", getTypeConstants());
        put("FlashMode", getFlashModeConstants());
        put("AutoFocus", getAutoFocusConstants());
        put("WhiteBalance", getWhiteBalanceConstants());
        put("VideoQuality", getVideoQualityConstants());
        put("BarCodeType", getBarCodeConstants());
        put("FaceDetection", Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("Mode", getFaceDetectionModeConstants());
            put("Landmarks", getFaceDetectionLandmarksConstants());
            put("Classifications", getFaceDetectionClassificationsConstants());
          }

          private Map<String, Object> getFaceDetectionModeConstants() {
            return Collections.unmodifiableMap(new HashMap<String, Object>() {
              {
                put("fast", ExpoFaceDetector.FAST_MODE);
                put("accurate", ExpoFaceDetector.ACCURATE_MODE);
              }
            });
          }

          private Map<String, Object> getFaceDetectionClassificationsConstants() {
            return Collections.unmodifiableMap(new HashMap<String, Object>() {
              {
                put("all", ExpoFaceDetector.ALL_CLASSIFICATIONS);
                put("none", ExpoFaceDetector.NO_CLASSIFICATIONS);
              }
            });
          }

          private Map<String, Object> getFaceDetectionLandmarksConstants() {
            return Collections.unmodifiableMap(new HashMap<String, Object>() {
              {
                put("all", ExpoFaceDetector.ALL_LANDMARKS);
                put("none", ExpoFaceDetector.NO_LANDMARKS);
              }
            });
          }
        }));
      }

      private Map<String, Object> getTypeConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("front", Constants.FACING_FRONT);
            put("back", Constants.FACING_BACK);
          }
        });
      }

      private Map<String, Object> getFlashModeConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("off", Constants.FLASH_OFF);
            put("on", Constants.FLASH_ON);
            put("auto", Constants.FLASH_AUTO);
            put("torch", Constants.FLASH_TORCH);
          }
        });
      }

      private Map<String, Object> getAutoFocusConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("on", true);
            put("off", false);
          }
        });
      }

      private Map<String, Object> getWhiteBalanceConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("auto", Constants.WB_AUTO);
            put("cloudy", Constants.WB_CLOUDY);
            put("sunny", Constants.WB_SUNNY);
            put("shadow", Constants.WB_SHADOW);
            put("fluorescent", Constants.WB_FLUORESCENT);
            put("incandescent", Constants.WB_INCANDESCENT);
          }
        });
      }

      private Map<String, Object> getVideoQualityConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("2160p", VIDEO_2160P);
            put("1080p", VIDEO_1080P);
            put("720p", VIDEO_720P);
            put("480p", VIDEO_480P);
            put("4:3", VIDEO_4x3);
          }
        });
      }

      private Map<String, Object> getBarCodeConstants() {
        return VALID_BARCODE_TYPES;
      }
    });
  }

  @ReactMethod
  public void pausePreview(final int viewTag) {
    final ReactApplicationContext context = getReactApplicationContext();
    UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        final ExpoCameraView cameraView;

        try {
          cameraView = (ExpoCameraView) nativeViewHierarchyManager.resolveView(viewTag);
          if (cameraView.isCameraOpened()) {
            cameraView.pausePreview();
          }
        } catch (Exception e) {
          EXL.e("E_CAMERA_BAD_VIEWTAG", "pausePreview: Expected a Camera component");
        }
      }
    });
  }

  @ReactMethod
  public void resumePreview(final int viewTag) {
    final ReactApplicationContext context = getReactApplicationContext();
    UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        final ExpoCameraView cameraView;

        try {
          cameraView = (ExpoCameraView) nativeViewHierarchyManager.resolveView(viewTag);
          if (cameraView.isCameraOpened()) {
            cameraView.resumePreview();
          }
        } catch (Exception e) {
          EXL.e("E_CAMERA_BAD_VIEWTAG", "resumePreview: Expected a Camera component");
        }
      }
    });
  }

  @ReactMethod
  public void takePicture(final ReadableMap options, final int viewTag, final Promise promise) {
    final ReactApplicationContext context = getReactApplicationContext();
    final File cacheDirectory = mScopedContext.getCacheDir();
    UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        ExpoCameraView cameraView = (ExpoCameraView) nativeViewHierarchyManager.resolveView(viewTag);

        try {
          if (!Build.FINGERPRINT.contains("generic")) {
            if (cameraView.isCameraOpened()) {
              cameraView.takePicture(options, promise, cacheDirectory);
            } else {
              promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
            }
          } else {
            Bitmap image = ExpoCameraViewHelper.generateSimulatorPhoto(cameraView.getWidth(), cameraView.getHeight());
            if (options.hasKey("fastMode") && options.getBoolean("fastMode")) {
              promise.resolve(null);
            }
            new ResolveTakenPictureAsyncTask(image, promise, options, cacheDirectory, cameraView).execute();
          }
        } catch (Exception e) {
          promise.reject("E_CAPTURE_FAILED", e.getMessage());
        }
      }
    });
  }

  @ReactMethod
  public void record(final ReadableMap options, final int viewTag, final Promise promise) {
    if ((!options.hasKey("mute") || (options.hasKey("mute") && !options.getBoolean("mute"))) &&
        !Exponent.getInstance().getPermissions(Manifest.permission.RECORD_AUDIO, this.experienceId)) {
      promise.reject(new SecurityException("User rejected audio permissions"));
      return;
    }
    final ReactApplicationContext context = getReactApplicationContext();
    final File cacheDirectory = mScopedContext.getCacheDir();
    UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        final ExpoCameraView cameraView;

        try {
          cameraView = (ExpoCameraView) nativeViewHierarchyManager.resolveView(viewTag);
          if (cameraView.isCameraOpened()) {
            cameraView.record(options, promise, cacheDirectory);
          } else {
            promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
          }
        } catch (Exception e) {
          promise.reject("E_CAMERA_BAD_VIEWTAG", "recordAsync: Expected a Camera component");
        }
      }
    });
  }

  @ReactMethod
  public void stopRecording(final int viewTag) {
    final ReactApplicationContext context = getReactApplicationContext();
    UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        final ExpoCameraView cameraView;

        try {
          cameraView = (ExpoCameraView) nativeViewHierarchyManager.resolveView(viewTag);
          if (cameraView.isCameraOpened()) {
            cameraView.stopRecording();
          }
        } catch (Exception e) {
          EXL.e("E_CAMERA_BAD_VIEWTAG", "stopRecording: Expected a Camera component");
        }
      }
    });
  }

  @ReactMethod
  public void getSupportedRatios(final int viewTag, final Promise promise) {
    final ReactApplicationContext context = getReactApplicationContext();
    UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        final ExpoCameraView cameraView;

        try {
          cameraView = (ExpoCameraView) nativeViewHierarchyManager.resolveView(viewTag);
          WritableArray result = Arguments.createArray();
          if (cameraView.isCameraOpened()) {
            Set<AspectRatio> ratios = cameraView.getSupportedAspectRatios();
            for (AspectRatio ratio : ratios) {
              result.pushString(ratio.toString());
            }
            promise.resolve(result);
          } else {
            promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
          }
        } catch (Exception e) {
          EXL.e("E_CAMERA_BAD_VIEWTAG", "getSupportedRatiosAsync: Expected a Camera component");
        }
      }
    });
  }

  @ReactMethod
  public void getAvailablePictureSizes(final String ratio, final int viewTag, final Promise promise) {
    final ReactApplicationContext context = getReactApplicationContext();
    UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        final ExpoCameraView cameraView;

        try {
          cameraView = (ExpoCameraView) nativeViewHierarchyManager.resolveView(viewTag);
          WritableArray result = Arguments.createArray();
          if (cameraView.isCameraOpened()) {
            SortedSet<Size> sizes = cameraView.getAvailablePictureSizes(AspectRatio.parse(ratio));
            for (Size size : sizes) {
              result.pushString(size.toString());
            }
            promise.resolve(result);
          } else {
            promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
          }
        } catch (Exception e) {
          promise.reject("E_CAMERA_BAD_VIEWTAG", "getAvailablePictureSizesAsync: Expected a Camera component");
        }
      }
    });
  }
}
