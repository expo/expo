package expo.modules.camera.tasks;

import android.os.Bundle;
import android.util.Log;

import java.util.List;

import org.unimodules.interfaces.facedetector.FaceDetector;

public class FaceDetectorAsyncTask extends android.os.AsyncTask<Void, Void, List<Bundle>> {
  private final static String TAG = FaceDetectorAsyncTask.class.getSimpleName();

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
      try {
        return mFaceDetector.detectFaces(mImageData, mWidth, mHeight, mRotation, mFacing, mScaleX, mScaleY);
      } catch (Exception e) {
        // for some reason, sometimes the very first preview frame the camera passes back to us
        // doesn't have the correct amount of data (data.length is too small for the height and width)
        // which throws, so we just return null
        // subsequent frames are all the correct length & don't seem to throw
        Log.e(TAG, "Failed to detect face: " + e.getMessage());
      }
    }

    return null;
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
