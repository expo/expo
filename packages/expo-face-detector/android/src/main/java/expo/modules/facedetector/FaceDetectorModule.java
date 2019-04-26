package expo.modules.facedetector;

import android.content.Context;
import android.os.Bundle;

import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetectorOptions;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.interfaces.facedetector.FaceDetector;
import org.unimodules.interfaces.facedetector.FaceDetectorProvider;

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
    mModuleRegistry = moduleRegistry;
  }

  private FaceDetector detectorForOptions(HashMap<String, Object> options, Context context) {
    FaceDetectorProvider faceDetectorProvider = mModuleRegistry.getModule(org.unimodules.interfaces.facedetector.FaceDetectorProvider.class);

    FaceDetector faceDetector = faceDetectorProvider.createFaceDetectorWithContext(context);
    faceDetector.setSettings(options);

    return faceDetector;
  }
}
