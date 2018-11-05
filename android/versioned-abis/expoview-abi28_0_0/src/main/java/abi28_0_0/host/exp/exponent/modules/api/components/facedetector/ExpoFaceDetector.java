package abi28_0_0.host.exp.exponent.modules.api.components.facedetector;

import android.content.Context;
import android.util.Log;
import android.util.SparseArray;

import com.google.android.gms.vision.face.Face;
import com.google.android.gms.vision.face.FaceDetector;

import abi28_0_0.host.exp.exponent.modules.api.components.camera.utils.ImageDimensions;

public class ExpoFaceDetector {
  public static int ALL_CLASSIFICATIONS = FaceDetector.ALL_CLASSIFICATIONS;
  public static int NO_CLASSIFICATIONS = FaceDetector.NO_CLASSIFICATIONS;
  public static int ALL_LANDMARKS = FaceDetector.ALL_LANDMARKS;
  public static int NO_LANDMARKS = FaceDetector.NO_LANDMARKS;
  public static int ACCURATE_MODE = FaceDetector.ACCURATE_MODE;
  public static int FAST_MODE = FaceDetector.FAST_MODE;

  private FaceDetector mFaceDetector = null;
  private ImageDimensions mPreviousDimensions;
  private FaceDetector.Builder mBuilder = null;

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

  public void setTracking(boolean trackingEnabled) {
    release();
    mBuilder.setTrackingEnabled(trackingEnabled);
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
