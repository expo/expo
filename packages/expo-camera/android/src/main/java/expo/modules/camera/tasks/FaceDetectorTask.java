package expo.modules.camera.tasks;

import expo.modules.interfaces.facedetector.FaceDetectorInterface;

public class FaceDetectorTask {

  private byte[] mImageData;
  private int mWidth;
  private int mHeight;
  private int mRotation;
  private boolean mMirrored;
  private double mScaleX;
  private double mScaleY;
  private FaceDetectorInterface mFaceDetector;
  private FaceDetectorAsyncTaskDelegate mDelegate;

  public FaceDetectorTask(
      FaceDetectorAsyncTaskDelegate delegate,
      FaceDetectorInterface faceDetector,
      byte[] imageData,
      int width,
      int height,
      int rotation,
      boolean mirrored,
      double scaleX,
      double scaleY
  ) {
    mImageData = imageData;
    mWidth = width;
    mHeight = height;
    mMirrored = mirrored;
    mScaleX = scaleX;
    mScaleY = scaleY;
    mRotation = rotation;
    mDelegate = delegate;
    mFaceDetector = faceDetector;
  }

  public void execute() {
    mFaceDetector.detectFaces(mImageData, mWidth, mHeight, mRotation, mMirrored, mScaleX, mScaleY, result -> {
      if (result != null) {
        mDelegate.onFacesDetected(result);
      } else {
        mDelegate.onFaceDetectionError(mFaceDetector);
      }
      mDelegate.onFaceDetectingTaskCompleted();
    }, error -> {
      mDelegate.onFaceDetectionError(mFaceDetector);
      mDelegate.onFaceDetectingTaskCompleted();
    }, skippedReason -> mDelegate.onFaceDetectingTaskCompleted());
  }

}
