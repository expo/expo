package expo.modules.facedetector;

import android.content.Context;
import android.os.Bundle;

import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetectorOptions;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import expo.modules.facedetector.tasks.FileFaceDetectionCompletionListener;
import expo.modules.facedetector.tasks.FileFaceDetectionTask;

public class FaceDetectorModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = "ExpoFaceDetector";

  private static final String MODE_OPTION_KEY = "mode";
  private static final String DETECT_LANDMARKS_OPTION_KEY = "detectLandmarks";
  private static final String RUN_CLASSIFICATIONS_OPTION_KEY = "runClassifications";

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
            put("fast", FirebaseVisionFaceDetectorOptions.FAST);
            put("accurate", FirebaseVisionFaceDetectorOptions.ACCURATE);
          }
        });
      }

      private Map<String, Object> getFaceDetectionClassificationsConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("all", FirebaseVisionFaceDetectorOptions.ALL_CLASSIFICATIONS);
            put("none", FirebaseVisionFaceDetectorOptions.NO_CLASSIFICATIONS);
          }
        });
      }

      private Map<String, Object> getFaceDetectionLandmarksConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("all", FirebaseVisionFaceDetectorOptions.ALL_LANDMARKS);
            put("none", FirebaseVisionFaceDetectorOptions.NO_LANDMARKS);
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
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    // do nothing
  }

  private static ExpoFaceDetector detectorForOptions(HashMap<String, Object> options, Context context) {
    ExpoFaceDetector detector = new ExpoFaceDetector(context);
    detector.setTrackingEnabled(false);

    if (options.get(MODE_OPTION_KEY) != null) {
      detector.setMode(((Number) options.get(MODE_OPTION_KEY)).intValue());
    }

    if (options.get(RUN_CLASSIFICATIONS_OPTION_KEY) != null) {
      detector.setClassificationType(((Number) options.get(RUN_CLASSIFICATIONS_OPTION_KEY)).intValue());
    }

    if (options.get(DETECT_LANDMARKS_OPTION_KEY) != null) {
      detector.setLandmarkType(((Number) options.get(DETECT_LANDMARKS_OPTION_KEY)).intValue());
    }

    return detector;
  }
}
