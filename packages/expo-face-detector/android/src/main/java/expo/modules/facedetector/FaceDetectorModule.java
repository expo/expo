package expo.modules.facedetector;

import android.content.Context;
import android.os.Bundle;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.interfaces.ExpoMethod;
import expo.core.ExportedModule;
import expo.core.Promise;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.modules.facedetector.tasks.FileFaceDetectionAsyncTask;
import expo.modules.facedetector.tasks.FileFaceDetectionCompletionListener;

public class FaceDetectorModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoFaceDetector";

  private static final String MODE_OPTION_KEY = "mode";
  private static final String DETECT_LANDMARKS_OPTION_KEY = "detectLandmarks";
  private static final String RUN_CLASSIFICATIONS_OPTION_KEY = "runClassifications";

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
    });
  }

  @ExpoMethod
  public void detectFaces(HashMap<String, Object> options, final Promise promise) {
    // TODO: Check file scope
    new FileFaceDetectionAsyncTask(detectorForOptions(options, getContext()), options, new FileFaceDetectionCompletionListener() {
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
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  private static ExpoFaceDetector detectorForOptions(HashMap<String, Object> options, Context context) {
    ExpoFaceDetector detector = new ExpoFaceDetector(context);
    detector.setTrackingEnabled(false);

    if(options.get(MODE_OPTION_KEY) != null) {
      detector.setMode(((Number) options.get(MODE_OPTION_KEY)).intValue());
    }

    if(options.get(RUN_CLASSIFICATIONS_OPTION_KEY) != null) {
      detector.setClassificationType(((Number) options.get(RUN_CLASSIFICATIONS_OPTION_KEY)).intValue());
    }

    if(options.get(DETECT_LANDMARKS_OPTION_KEY) != null) {
      detector.setLandmarkType(((Number) options.get(DETECT_LANDMARKS_OPTION_KEY)).intValue());
    }

    return detector;
  }
}
