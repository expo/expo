package abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks;

import android.util.SparseArray;

import com.google.android.gms.vision.face.Face;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.exceptions.ExceptionUtils;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFaceDetector;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFrame;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFrameFactory;

public class FaceDetectorAsyncTask extends android.os.AsyncTask<Void, Void, SparseArray<Face>> {
  private byte[] mImageData;
  private int mWidth;
  private int mHeight;
  private int mRotation;
  private ExpoFaceDetector mFaceDetector;
  private FaceDetectorAsyncTaskDelegate mDelegate;

  private String TAG = FaceDetectorAsyncTask.class.getSimpleName();

  public FaceDetectorAsyncTask(
      FaceDetectorAsyncTaskDelegate delegate,
      ExpoFaceDetector faceDetector,
      byte[] imageData,
      int width,
      int height,
      int rotation
  ) {
    mImageData = imageData;
    mWidth = width;
    mHeight = height;
    mRotation = rotation;
    mDelegate = delegate;
    mFaceDetector = faceDetector;
  }

  @Override
  protected SparseArray<Face> doInBackground(Void... ignored) {
    if (isCancelled() || mDelegate == null || mFaceDetector == null || !mFaceDetector.isOperational()) {
      return null;
    }

    try {
      ExpoFrame frame = ExpoFrameFactory.buildFrame(mImageData, mWidth, mHeight, mRotation);
      return mFaceDetector.detect(frame);
    } catch (Exception e) {
      // for some reason, sometimes the very first preview frame the camera passes back to us
      // doesn't have the correct amount of data (data.length is too small for the height and width)
      // which throws, so we just return null
      // subsequent frames are all the correct length & don't seem to throw
      EXL.e(TAG, "Failed to detect face: " + e.getMessage());
      return null;
    }
  }

  @Override
  protected void onPostExecute(SparseArray<Face> faces) {
    super.onPostExecute(faces);

    if (faces == null) {
      mDelegate.onFaceDetectionError(mFaceDetector);
    } else {
      mDelegate.onFacesDetected(faces, mWidth, mHeight, mRotation);
      mDelegate.onFaceDetectingTaskCompleted();
    }
  }
}
