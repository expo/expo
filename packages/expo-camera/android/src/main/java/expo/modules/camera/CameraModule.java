package expo.modules.camera;

import android.Manifest;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Build;

import com.google.android.cameraview.AspectRatio;
import com.google.android.cameraview.Constants;
import com.google.android.cameraview.Size;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.interfaces.permissions.Permissions;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;

import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask;

public class CameraModule extends ExportedModule {
  private static final String TAG = "ExponentCameraModule";
  private static final String ERROR_TAG = "E_CAMERA";
  private ModuleRegistry mModuleRegistry;

  static final int VIDEO_2160P = 0;
  static final int VIDEO_1080P = 1;
  static final int VIDEO_720P = 2;
  static final int VIDEO_480P = 3;
  static final int VIDEO_4x3 = 4;

  public CameraModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("Type", getTypeConstants());
        put("FlashMode", getFlashModeConstants());
        put("AutoFocus", getAutoFocusConstants());
        put("WhiteBalance", getWhiteBalanceConstants());
        put("VideoQuality", getVideoQualityConstants());
        put("FaceDetection", Collections.unmodifiableMap(new HashMap<>()));
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
    });
  }

  @ExpoMethod
  public void pausePreview(final int viewTag, final Promise promise) {
    addUIBlock(viewTag, new UIManager.UIBlock<ExpoCameraView>() {
      @Override
      public void resolve(ExpoCameraView view) {
        try {
          if (view.isCameraOpened()) {
            view.pausePreview();
          }
        } catch (Exception e) {
          promise.reject(ERROR_TAG, "pausePreview -- exception occurred -- " + e.getMessage(), e);
        }
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject(ERROR_TAG, throwable);
      }
    });
  }

  @ExpoMethod
  public void resumePreview(final int viewTag, final Promise promise) {
    addUIBlock(viewTag, new UIManager.UIBlock<ExpoCameraView>() {
      @Override
      public void resolve(ExpoCameraView view) {
        try {
          if (view.isCameraOpened()) {
            view.resumePreview();
          }
        } catch (Exception e) {
          promise.reject(ERROR_TAG, "resumePreview -- exception occurred -- " + e.getMessage(), e);
        }
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject(ERROR_TAG, throwable);
      }
    });
  }

  @ExpoMethod
  public void takePicture(final Map<String, Object> options, final int viewTag, final Promise promise) {
    final File cacheDirectory = getContext().getCacheDir();
    addUIBlock(viewTag, new UIManager.UIBlock<ExpoCameraView>() {
      @Override
      public void resolve(ExpoCameraView view) {
        if (!Build.FINGERPRINT.contains("generic")) {
          if (view.isCameraOpened()) {
            view.takePicture(options, promise, cacheDirectory);
          } else {
            promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
          }
        } else {
          Bitmap image = CameraViewHelper.generateSimulatorPhoto(view.getWidth(), view.getHeight());
          new ResolveTakenPictureAsyncTask(image, promise, options, cacheDirectory, view).execute();
        }
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject(ERROR_TAG, throwable);
      }
    });
  }

  @ExpoMethod
  public void record(final Map<String, Object> options, final int viewTag, final Promise promise) {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    if (permissionsManager.hasGrantedPermissions(Manifest.permission.RECORD_AUDIO)) {
      final File cacheDirectory = getContext().getCacheDir();
      addUIBlock(viewTag, new UIManager.UIBlock<ExpoCameraView>() {
        @Override
        public void resolve(ExpoCameraView view) {
          if (view.isCameraOpened()) {
            view.record(options, promise, cacheDirectory);
          } else {
            promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
          }
        }

        @Override
        public void reject(Throwable throwable) {
          promise.reject(ERROR_TAG, throwable);
        }
      });
    } else {
      promise.reject(new SecurityException("User rejected audio permissions"));
    }
  }

  @ExpoMethod
  public void stopRecording(final int viewTag, final Promise promise) {
    addUIBlock(viewTag, new UIManager.UIBlock<ExpoCameraView>() {
      @Override
      public void resolve(ExpoCameraView view) {
        if (view.isCameraOpened()) {
          view.stopRecording();
          promise.resolve(true);
        } else {
          promise.reject(ERROR_TAG, "Camera is not open");
        }
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject(ERROR_TAG, throwable);
      }
    });
  }

  @ExpoMethod
  public void getSupportedRatios(final int viewTag, final Promise promise) {
    addUIBlock(viewTag, new UIManager.UIBlock<ExpoCameraView>() {
      @Override
      public void resolve(ExpoCameraView view) {
        if (view.isCameraOpened()) {
          Set<AspectRatio> ratios = view.getSupportedAspectRatios();
          List<String> supportedRatios = new ArrayList<>(ratios.size());
          for (AspectRatio ratio : ratios) {
            supportedRatios.add(ratio.toString());
          }
          promise.resolve(supportedRatios);
        } else {
          promise.reject(ERROR_TAG, "Camera is not running");
        }
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject(ERROR_TAG, throwable);
      }
    });
  }

  @ExpoMethod
  public void getAvailablePictureSizes(final String ratio, final int viewTag, final Promise promise) {
    addUIBlock(viewTag, new UIManager.UIBlock<ExpoCameraView>() {
      @Override
      public void resolve(ExpoCameraView view) {
        if (view.isCameraOpened()) {
          try {
            SortedSet<Size> sizes = view.getAvailablePictureSizes(AspectRatio.parse(ratio));
            List<String> result = new ArrayList<>(sizes.size());
            for (Size size : sizes) {
              result.add(size.toString());
            }
            promise.resolve(result);
          } catch (Exception e) {
            promise.reject(ERROR_TAG, "getAvailablePictureSizes -- unexpected error -- " + e.getMessage(), e);
          }
        } else {
          promise.reject(ERROR_TAG, "Camera is not running");
        }
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject(ERROR_TAG, throwable);
      }
    });
  }

  private void addUIBlock(int viewTag, UIManager.UIBlock<ExpoCameraView> block) {
    UIManager manager = mModuleRegistry.getModule(UIManager.class);
    if (manager == null) {
      block.reject(new IllegalStateException("Implementation of " + UIManager.class.getName() + " is null. Are you sure you've included a proper Expo adapter for your platform?"));
    } else {
      manager.addUIBlock(viewTag, block, ExpoCameraView.class);
    }
  }

  @ExpoMethod
  public void requestPermissionsAsync(final Promise promise) {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.CAMERA);
  }

  @ExpoMethod
  public void getPermissionsAsync(final Promise promise) {
    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.CAMERA);
  }
}
