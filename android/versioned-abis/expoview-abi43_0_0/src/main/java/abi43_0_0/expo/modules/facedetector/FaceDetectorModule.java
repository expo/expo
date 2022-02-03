package abi43_0_0.expo.modules.facedetector;

import android.content.Context;
import android.os.Bundle;

import abi43_0_0.expo.modules.core.ExportedModule;
import abi43_0_0.expo.modules.core.ModuleRegistry;
import abi43_0_0.expo.modules.core.Promise;
import abi43_0_0.expo.modules.core.interfaces.ExpoMethod;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import abi43_0_0.expo.modules.facedetector.tasks.FileFaceDetectionCompletionListener;
import abi43_0_0.expo.modules.facedetector.tasks.FileFaceDetectionTask;
import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface;
import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectorProviderInterface;

public class FaceDetectorModule extends ExportedModule {
  private static final String TAG = "ExpoFaceDetector";

  private static final String MODE_OPTION_KEY = "Mode";
  private static final String DETECT_LANDMARKS_OPTION_KEY = "Landmarks";
  private static final String RUN_CLASSIFICATIONS_OPTION_KEY = "Classifications";

  private ModuleRegistry mModuleRegistry;

  public FaceDetectorModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put(MODE_OPTION_KEY, getFaceDetectionModeConstants());
        put(DETECT_LANDMARKS_OPTION_KEY, getFaceDetectionLandmarksConstants());
        put(RUN_CLASSIFICATIONS_OPTION_KEY, getFaceDetectionClassificationsConstants());
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
    });
  }

  @ExpoMethod
  public void detectFaces(HashMap<String, Object> options, final Promise promise) {
    // TODO: Check file scope
    new FileFaceDetectionTask(detectorForOptions(options, getContext()), options, new FileFaceDetectionCompletionListener() {
      @Override
      public void resolve(Bundle result) {
        promise.resolve(result);
      }

      @Override
      public void reject(String tag, String message) {
        promise.reject(tag, message, null);
      }
    }).execute();
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  private FaceDetectorInterface detectorForOptions(HashMap<String, Object> options, Context context) {
    FaceDetectorProviderInterface faceDetectorProvider = mModuleRegistry.getModule(FaceDetectorProviderInterface.class);

    FaceDetectorInterface faceDetector = faceDetectorProvider.createFaceDetectorWithContext(context);
    faceDetector.setSettings(options);

    return faceDetector;
  }
}
