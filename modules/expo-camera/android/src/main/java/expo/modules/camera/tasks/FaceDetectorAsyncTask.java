package expo.modules.camera.tasks;

import android.os.Bundle;

import java.util.List;

import expo.interfaces.facedetector.FaceDetector;

public class FaceDetectorAsyncTask extends android.os.AsyncTask<Void, Void, List<Bundle>> {
  private byte[] mImageData;
  private int mWidth;
  private int mHeight;
  private int mRotation;
  private int mFacing;
  private double mScaleX;
  private double mScaleY;
  private FaceDetector mFaceDetector;
  private FaceDetectorAsyncTaskDelegate mDelegate;

  public FaceDetectorAsyncTask(
    FaceDetectorAsyncTaskDelegate delegate,
    FaceDetector faceDetector,
    byte[] imageData,
    int width,
    int height,
    int rotation,
    int facing,
    double scaleX,
    double scaleY
  ) {
    mImageData = imageData;
    mWidth = width;
    mHeight = height;
    mFacing = facing;
    mScaleX = scaleX;
    mScaleY = scaleY;
    mRotation = rotation;
    mDelegate = delegate;
    mFaceDetector = faceDetector;
  }

  @Override
  protected List<Bundle> doInBackground(Void... ignored) {
    if (isCancelled() || mDelegate == null || mFaceDetector == null) {
      return null;
    }

    if (mFaceDetector.isOperational()) {
      return mFaceDetector.detectFaces(mImageData, mWidth, mHeight, mRotation, mFacing, mScaleX, mScaleY);
    } else {
      return null;
    }
  }

  @Override
  protected void onPostExecute(List<Bundle> faces) {
    super.onPostExecute(faces);

    if (faces == null) {
      mDelegate.onFaceDetectionError(mFaceDetector);
    } else {
      mDelegate.onFacesDetected(faces);
    }
    mDelegate.onFaceDetectingTaskCompleted();
  }
}
