package expo.modules.facedetector;

import android.content.Context;
import android.os.Bundle;
import android.util.SparseArray;

import com.google.android.gms.vision.face.Face;
import com.google.android.gms.vision.face.FaceDetector;

import java.util.ArrayList;
import java.util.HashMap;
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

  private FaceDetector mFaceDetector = null;
  private ImageDimensions mPreviousDimensions;
  private FaceDetector.Builder mBuilder;

  private int mClassificationType = NO_CLASSIFICATIONS;
  private int mLandmarkType = NO_LANDMARKS;
  private float mMinFaceSize = 0.15f;
  private int mMode = FAST_MODE;

  public ExpoFaceDetector(Context context) {
    mBuilder = new FaceDetector.Builder(context);
    mBuilder.setMinFaceSize(mMinFaceSize);
    mBuilder.setMode(mMode);
    mBuilder.setLandmarkType(mLandmarkType);
    mBuilder.setClassificationType(mClassificationType);
  }

  // Public API

  public boolean isOperational() {
    if (mFaceDetector == null) {
      createFaceDetector();
    }

    return mFaceDetector.isOperational();
  }

  public SparseArray<Face> detect(ExpoFrame frame) {
    // If the frame has different dimensions, create another face detector.
    // Otherwise we will get nasty "inconsistent image dimensions" error from detector
    // and no face will be detected.
    if (!frame.getDimensions().equals(mPreviousDimensions)) {
      releaseFaceDetector();
    }

    if (mFaceDetector == null) {
      createFaceDetector();
      mPreviousDimensions = frame.getDimensions();
    }

    return mFaceDetector.detect(frame.getFrame());
  }

  public List<Bundle> detectFaces(byte[] imageData, int width, int height, int rotation, int facing, double scaleX, double scaleY) {
    try {
      ExpoFrame frame = ExpoFrameFactory.buildFrame(imageData, width, height, rotation);
      SparseArray<Face> detectedFaces = detect(frame);
      List<Bundle> facesList = new ArrayList<>();
      for(int i = 0; i < detectedFaces.size(); i++) {
        Face face = detectedFaces.valueAt(i);
        Bundle serializedFace = FaceDetectorUtils.serializeFace(face, scaleX, scaleY);
        if (facing == 1) { // CameraView.FACING_FRONT
          serializedFace = FaceDetectorUtils.rotateFaceX(serializedFace, frame.getDimensions().getWidth(), scaleX);
        } else {
          serializedFace = FaceDetectorUtils.changeAnglesDirection(serializedFace);
        }
        facesList.add(serializedFace);
      }
      return facesList;
    } catch (Exception e) {
      return new ArrayList<>();
    }
  }

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
      mBuilder.setClassificationType(classificationType);
      mClassificationType = classificationType;
    }
  }

  public void setLandmarkType(int landmarkType) {
    if (landmarkType != mLandmarkType) {
      release();
      mBuilder.setLandmarkType(landmarkType);
      mLandmarkType = landmarkType;
    }
  }

  public void setMode(int mode) {
    if (mode != mMode) {
      release();
      mBuilder.setMode(mode);
      mMode = mode;
    }
  }

  public void setTrackingEnabled(boolean tracking) {
    release();
    mBuilder.setTrackingEnabled(tracking);
  }

  public void release() {
    releaseFaceDetector();
    mPreviousDimensions = null;
  }

  // Lifecycle methods

  private void releaseFaceDetector() {
    if (mFaceDetector != null) {
      mFaceDetector.release();
      mFaceDetector = null;
    }
  }

  private void createFaceDetector() {
    mFaceDetector = mBuilder.build();
  }
}
