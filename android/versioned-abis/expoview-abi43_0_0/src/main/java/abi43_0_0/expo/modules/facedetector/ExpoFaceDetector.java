package abi43_0_0.expo.modules.facedetector;

import static com.google.mlkit.vision.common.InputImage.IMAGE_FORMAT_NV21;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetector;
import com.google.mlkit.vision.face.FaceDetectorOptions;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import abi43_0_0.expo.modules.core.interfaces.Function;
import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectionError;
import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectionSkipped;
import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectionUnspecifiedError;
import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface;
import abi43_0_0.expo.modules.interfaces.facedetector.FacesDetectionCompleted;


public class ExpoFaceDetector implements FaceDetectorInterface {
  private static final String RUN_CLASSIFICATIONS_KEY = "runClassifications";
  private static final String DETECT_LANDMARKS_KEY = "detectLandmarks";
  private static final String TRACKING_KEY = "tracking";
  private static final String MIN_INTERVAL_MILLIS_KEY = "minDetectionInterval";
  private static final String MODE_KEY = "mode";

  public static int ALL_CLASSIFICATIONS =  FaceDetectorOptions.CLASSIFICATION_MODE_ALL;
  public static int NO_CLASSIFICATIONS = FaceDetectorOptions.CLASSIFICATION_MODE_NONE;
  public static int ALL_LANDMARKS = FaceDetectorOptions.LANDMARK_MODE_ALL;
  public static int NO_LANDMARKS = FaceDetectorOptions.LANDMARK_MODE_NONE;
  public static int ACCURATE_MODE = FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE;
  public static int FAST_MODE = FaceDetectorOptions.PERFORMANCE_MODE_FAST;

  private FaceDetector mFaceDetector = null;

  private Context mContext;

  private int mClassificationType = NO_CLASSIFICATIONS;
  private int mLandmarkType = NO_LANDMARKS;
  private float mMinFaceSize = 0.15f;
  private boolean mTracking = false;
  private long mMinDetectionInterval = 0;
  private long lastDetectionMillis = 0;
  private int mMode = FAST_MODE;

  public ExpoFaceDetector(Context context) {
    this.mContext = context;
  }

  // Public API

  @Override
  public void detectFaces(Uri filePath, FacesDetectionCompleted complete, FaceDetectionError error) throws IOException {

    if (mFaceDetector == null) {
      createFaceDetector();
    }
    InputImage image = InputImage.fromFilePath(mContext, filePath);
    mFaceDetector.process(image)
        .addOnCompleteListener(
            faceDetectionHandler(FaceDetectorUtils::serializeFace, complete, error)
        );
  }

  @Override
  public void detectFaces(byte[] imageData, int width, int height, int rotation, boolean mirrored, double scaleX, double scaleY,
                          FacesDetectionCompleted complete,
                          FaceDetectionError error,
                          FaceDetectionSkipped skipped) {

    if (mFaceDetector == null) {
      createFaceDetector();
    }

    final int firRotation = getFirRotation(rotation);

    InputImage image = InputImage.fromByteArray(imageData, width, height, rotation, IMAGE_FORMAT_NV21);

    if (mMinDetectionInterval <= 0 || minIntervalPassed()) {
      lastDetectionMillis = System.currentTimeMillis();
      mFaceDetector.process(image)
          .addOnCompleteListener(
              faceDetectionHandler(face -> {
                Bundle result = FaceDetectorUtils.serializeFace(face, scaleX, scaleY);
                if (mirrored) {
                  if (firRotation == 270 || firRotation == 90) {
                    result = FaceDetectorUtils.rotateFaceX(result, height, scaleX);
                  } else {
                    result = FaceDetectorUtils.rotateFaceX(result, width, scaleX);
                  }
                }
                return result;
              }, complete, error)
          );
    } else {
      skipped.onSkipped("Skipped frame due to time interval.");
    }
  }

  private int getFirRotation(int rotation) {
    rotation = (rotation + 360) % 360;
    if (rotation == 90) {
      return 90;
    }
    if (rotation == 180) {
      return 180;
    }
    if (rotation == 270) {
      return 270;
    }
    return 0;
  }

  private OnCompleteListener<List<Face>> faceDetectionHandler(Function<Face, Bundle> transformer, FacesDetectionCompleted complete, FaceDetectionError error) {
    return (task) -> {
      if (task.isComplete() && task.isSuccessful()) {
        ArrayList<Bundle> facesArray = new ArrayList<>();
        List<Face> faces = task.getResult();
        if (faces != null) {
          for (Face face : faces) {
            facesArray.add(transformer.apply(face));
          }
        }
        complete.detectionCompleted(facesArray);
      } else {
        error.onError(new FaceDetectionUnspecifiedError());
      }
    };
  }

  private boolean minIntervalPassed() {
    return (lastDetectionMillis + mMinDetectionInterval) < System.currentTimeMillis();
  }

  @Override
  public void setSettings(Map<String, Object> settings) {
    if (settings.get(MODE_KEY) instanceof Number) {
      setMode(((Number) settings.get(MODE_KEY)).intValue());
    }

    if (settings.get(DETECT_LANDMARKS_KEY) instanceof Number) {
      setLandmarkType(((Number) settings.get(DETECT_LANDMARKS_KEY)).intValue());
    }

    if (settings.get(TRACKING_KEY) instanceof Boolean) {
      setTrackingEnabled((Boolean) settings.get(TRACKING_KEY));
    }

    if (settings.get(RUN_CLASSIFICATIONS_KEY) instanceof Number) {
      setClassificationType(((Number) settings.get(RUN_CLASSIFICATIONS_KEY)).intValue());
    }

    if (settings.get(MIN_INTERVAL_MILLIS_KEY) instanceof Number) {
      setMinIntervalMillis(((Number) settings.get(MIN_INTERVAL_MILLIS_KEY)).intValue());
    } else {
      setMinIntervalMillis(0);
    }
  }

  public void setClassificationType(int classificationType) {
    if (classificationType != mClassificationType) {
      release();
      mClassificationType = classificationType;
    }
  }

  public void setLandmarkType(int landmarkType) {
    if (landmarkType != mLandmarkType) {
      release();
      mLandmarkType = landmarkType;
    }
  }

  public void setMode(int mode) {
    if (mode != mMode) {
      release();
      mMode = mode;
    }
  }

  private void setMinIntervalMillis(long intValue) {
    this.mMinDetectionInterval = intValue;
  }

  public void setTrackingEnabled(boolean tracking) {
    if (tracking != mTracking) {
      release();
      mTracking = tracking;
    }
  }

  @Override
  public void release() {
    releaseFaceDetector();
  }

  // Lifecycle methods

  private void releaseFaceDetector() {
    if (mFaceDetector != null) {
      mFaceDetector = null;
    }
  }

  private void createFaceDetector() {
    mFaceDetector = FaceDetection.getClient(createOptions());
  }

  private FaceDetectorOptions createOptions() {
    FaceDetectorOptions.Builder builder = new FaceDetectorOptions.Builder()
        .setClassificationMode(mClassificationType)
        .setLandmarkMode(mLandmarkType)
        .setPerformanceMode(mMode)
        .setMinFaceSize(mMinFaceSize);
    if (mTracking) {
      builder.enableTracking();
    }
    return builder.build();
  }

}
