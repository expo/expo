package abi38_0_0.expo.modules.facedetector;

import android.content.Context;
import android.os.Bundle;

import abi38_0_0.org.unimodules.core.ExportedModule;
import abi38_0_0.org.unimodules.core.ModuleRegistry;
import abi38_0_0.org.unimodules.core.Promise;
import abi38_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi38_0_0.org.unimodules.interfaces.facedetector.FaceDetector;
import abi38_0_0.org.unimodules.interfaces.facedetector.FaceDetectorProvider;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import abi38_0_0.expo.modules.facedetector.tasks.FileFaceDetectionCompletionListener;
import abi38_0_0.expo.modules.facedetector.tasks.FileFaceDetectionTask;

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

  private FaceDetector detectorForOptions(HashMap<String, Object> options, Context context) {
    FaceDetectorProvider faceDetectorProvider = mModuleRegistry.getModule(FaceDetectorProvider.class);

    FaceDetector faceDetector = faceDetectorProvider.createFaceDetectorWithContext(context);
    faceDetector.setSettings(options);

    return faceDetector;
  }
}
