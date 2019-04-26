package expo.modules.facedetector;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.util.SparseIntArray;
import android.view.Surface;

import com.google.android.gms.vision.face.FaceDetector;
import com.google.firebase.ml.vision.FirebaseVision;
import com.google.firebase.ml.vision.common.FirebaseVisionImage;
import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata;
import com.google.firebase.ml.vision.face.FirebaseVisionFace;
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetector;
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetectorOptions;

import org.unimodules.interfaces.facedetector.FaceDetectionError;
import org.unimodules.interfaces.facedetector.FaceDetectionUnspecifiedError;
import org.unimodules.interfaces.facedetector.FacesDetectionCompleted;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ExpoFaceDetector implements org.unimodules.interfaces.facedetector.FaceDetector {
  private static final String RUN_CLASSIFICATIONS_KEY = "runClassifications";
  private static final String DETECT_LANDMARKS_KEY = "detectLandmarks";
  private static final String TRACKING_KEY = "tracking";
  private static final String MODE_KEY = "mode";

  public static int ALL_CLASSIFICATIONS = FaceDetector.ALL_CLASSIFICATIONS;
  public static int NO_CLASSIFICATIONS = FaceDetector.NO_CLASSIFICATIONS;
  public static int ALL_LANDMARKS = FaceDetector.ALL_LANDMARKS;
  public static int NO_LANDMARKS = FaceDetector.NO_LANDMARKS;
  public static int ACCURATE_MODE = FaceDetector.ACCURATE_MODE;
  public static int FAST_MODE = FaceDetector.FAST_MODE;

  private static final SparseIntArray ORIENTATIONS = new SparseIntArray();

  static {
    ORIENTATIONS.append(Surface.ROTATION_0, 90);
    ORIENTATIONS.append(Surface.ROTATION_90, 0);
    ORIENTATIONS.append(Surface.ROTATION_180, 270);
    ORIENTATIONS.append(Surface.ROTATION_270, 180);
  }

  private FirebaseVisionFaceDetector mFaceDetector = null;
  private ImageDimensions mPreviousDimensions;

  private Context mContext;

  private int mClassificationType = NO_CLASSIFICATIONS;
  private int mLandmarkType = NO_LANDMARKS;
  private float mMinFaceSize = 0.15f;
  private int mMode = FAST_MODE;

  public ExpoFaceDetector(Context context) {
    this.mContext = context;
  }

  // Public API

  @Override
  public void detectFaces(Uri filePath, FacesDetectionCompleted listener, FaceDetectionError error) throws IOException {

    if (mFaceDetector == null) {
      createFaceDetector();
    }
    FirebaseVisionImage image = FirebaseVisionImage.fromFilePath(mContext, filePath);
    mFaceDetector.detectInImage(image).addOnCompleteListener(task -> {
      if (task.isComplete() && task.isComplete()) {
        ArrayList<Bundle> facesArray = new ArrayList<>();
        List<FirebaseVisionFace> faces = task.getResult();
        if (faces != null) {
          for (FirebaseVisionFace face : faces) {
            Bundle encodedFace = FaceDetectorUtils.serializeFace(face);
            encodedFace.putDouble("yawAngle", (-encodedFace.getDouble("yawAngle") + 360) % 360);
            encodedFace.putDouble("rollAngle", (-encodedFace.getDouble("rollAngle") + 360) % 360);
            facesArray.add(encodedFace);
          }
        }
        listener.detectionCompleted(facesArray);
      } else {
        error.onError(new FaceDetectionUnspecifiedError());
      }
    });
  }

  @Override
  public void detectFaces(byte[] imageData, int width, int height, int rotation, int facing, double scaleX, double scaleY, FacesDetectionCompleted listener, FaceDetectionError error) {

    FirebaseVisionImageMetadata metadata = new FirebaseVisionImageMetadata.Builder()
        .setWidth(width)   // 480x360 is typically sufficient for
        .setHeight(height)  // image recognition
        .setFormat(FirebaseVisionImageMetadata.IMAGE_FORMAT_NV21)
        .setRotation(rotation)
        .build();

    FirebaseVisionImage image = FirebaseVisionImage.fromByteArray(imageData, metadata);
    mFaceDetector.detectInImage(image).addOnCompleteListener(task -> {
//      if (task.)
    });
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

  public void setTrackingEnabled(boolean tracking) {
    release();
  }

  @Override
  public void release() {
    releaseFaceDetector();
    mPreviousDimensions = null;
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
    return new FirebaseVisionFaceDetectorOptions.Builder()
        .setClassificationMode(mClassificationType)
        .setLandmarkMode(mLandmarkType)
        .setPerformanceMode(mMode)
        .setMinFaceSize(mMinFaceSize)
        .build();
  }

}
