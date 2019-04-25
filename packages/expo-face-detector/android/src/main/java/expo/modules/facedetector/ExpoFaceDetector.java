package expo.modules.facedetector;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.vision.face.FaceDetector;
import com.google.firebase.ml.vision.FirebaseVision;
import com.google.firebase.ml.vision.common.FirebaseVisionImage;
import com.google.firebase.ml.vision.face.FirebaseVisionFace;
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetector;
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetectorOptions;

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

  public void detect(Uri filePath, OnCompleteListener<List<FirebaseVisionFace>> listener) throws IOException {

    if (mFaceDetector == null) {
      createFaceDetector();
    }
    FirebaseVisionImage image = FirebaseVisionImage.fromFilePath(mContext, filePath);
    mFaceDetector.detectInImage(image).addOnCompleteListener(listener);
  }

  @Override
  public List<Bundle> detectFaces(byte[] imageData, int width, int height, int rotation, int facing, double scaleX, double scaleY) {
//    try {
//      ExpoFrame frame = ExpoFrameFactory.buildFrame(imageData, width, height, rotation);
//      SparseArray<Face> detectedFaces = detect(frame);
//      List<Bundle> facesList = new ArrayList<>();
//      for (int i = 0; i < detectedFaces.size(); i++) {
//        Face face = detectedFaces.valueAt(i);
//        Bundle serializedFace = FaceDetectorUtils.serializeFace(face, scaleX, scaleY);
//        if (facing == 1) { // CameraView.FACING_FRONT
//          serializedFace = FaceDetectorUtils.rotateFaceX(serializedFace, frame.getDimensions().getWidth(), scaleX);
//        } else {
//          serializedFace = FaceDetectorUtils.changeAnglesDirection(serializedFace);
//        }
//        facesList.add(serializedFace);
//      }
//      return facesList;
//    } catch (Exception e) {
//      return new ArrayList<>();
//    }
    return new ArrayList<>();
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
