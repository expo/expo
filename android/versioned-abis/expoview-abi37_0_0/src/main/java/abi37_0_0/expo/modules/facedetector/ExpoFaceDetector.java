package abi37_0_0.expo.modules.facedetector;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.util.SparseIntArray;
import android.view.Surface;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.firebase.ml.vision.FirebaseVision;
import com.google.firebase.ml.vision.common.FirebaseVisionImage;
import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata;
import com.google.firebase.ml.vision.face.FirebaseVisionFace;
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetector;
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetectorOptions;

import abi37_0_0.org.unimodules.core.interfaces.Function;
import abi37_0_0.org.unimodules.interfaces.facedetector.FaceDetectionError;
import abi37_0_0.org.unimodules.interfaces.facedetector.FaceDetectionSkipped;
import abi37_0_0.org.unimodules.interfaces.facedetector.FaceDetectionUnspecifiedError;
import abi37_0_0.org.unimodules.interfaces.facedetector.FacesDetectionCompleted;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_0;
import static com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_180;
import static com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_270;
import static com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_90;

public class ExpoFaceDetector implements abi37_0_0.org.unimodules.interfaces.facedetector.FaceDetector {
  private static final String RUN_CLASSIFICATIONS_KEY = "runClassifications";
  private static final String DETECT_LANDMARKS_KEY = "detectLandmarks";
  private static final String TRACKING_KEY = "tracking";
  private static final String MIN_INTERVAL_MILLIS_KEY = "minDetectionInterval";
  private static final String MODE_KEY = "mode";

  public static int ALL_CLASSIFICATIONS = FirebaseVisionFaceDetectorOptions.ALL_CLASSIFICATIONS;
  public static int NO_CLASSIFICATIONS = FirebaseVisionFaceDetectorOptions.NO_CLASSIFICATIONS;
  public static int ALL_LANDMARKS = FirebaseVisionFaceDetectorOptions.ALL_LANDMARKS;
  public static int NO_LANDMARKS = FirebaseVisionFaceDetectorOptions.NO_LANDMARKS;
  public static int ACCURATE_MODE = FirebaseVisionFaceDetectorOptions.ACCURATE;
  public static int FAST_MODE = FirebaseVisionFaceDetectorOptions.FAST;

  private static final SparseIntArray ORIENTATIONS = new SparseIntArray();

  static {
    ORIENTATIONS.append(Surface.ROTATION_0, 90);
    ORIENTATIONS.append(Surface.ROTATION_90, 0);
    ORIENTATIONS.append(Surface.ROTATION_180, 270);
    ORIENTATIONS.append(Surface.ROTATION_270, 180);
  }

  private FirebaseVisionFaceDetector mFaceDetector = null;

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
    FirebaseVisionImage image = FirebaseVisionImage.fromFilePath(mContext, filePath);
    mFaceDetector.detectInImage(image)
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

    FirebaseVisionImageMetadata metadata = new FirebaseVisionImageMetadata.Builder()
        .setWidth(width)
        .setHeight(height)
        .setFormat(FirebaseVisionImageMetadata.IMAGE_FORMAT_NV21)
        .setRotation(firRotation)
        .build();

    FirebaseVisionImage image = FirebaseVisionImage.fromByteArray(imageData, metadata);

    if (mMinDetectionInterval <= 0 || minIntervalPassed()) {
      lastDetectionMillis = System.currentTimeMillis();
      mFaceDetector.detectInImage(image)
          .addOnCompleteListener(
              faceDetectionHandler(face -> {
                Bundle result = FaceDetectorUtils.serializeFace(face, scaleX, scaleY);
                if (mirrored) {
                  if (firRotation == ROTATION_270 || firRotation == ROTATION_90) {
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
      return ROTATION_90;
    }
    if (rotation == 180) {
      return ROTATION_180;
    }
    if (rotation == 270) {
      return ROTATION_270;
    }
    return ROTATION_0;
  }

  private OnCompleteListener<List<FirebaseVisionFace>> faceDetectionHandler(Function<FirebaseVisionFace, Bundle> transformer, FacesDetectionCompleted complete, FaceDetectionError error) {
    return (task) -> {
      if (task.isComplete() && task.isSuccessful()) {
        ArrayList<Bundle> facesArray = new ArrayList<>();
        List<FirebaseVisionFace> faces = task.getResult();
        if (faces != null) {
          for (FirebaseVisionFace face : faces) {
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
    mFaceDetector = FirebaseVision.getInstance().getVisionFaceDetector(createOptions());
  }

  private FirebaseVisionFaceDetectorOptions createOptions() {
    FirebaseVisionFaceDetectorOptions.Builder builder = new FirebaseVisionFaceDetectorOptions.Builder()
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
