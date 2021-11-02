package expo.modules.camera.tasks

import expo.modules.interfaces.facedetector.FaceDetectorInterface

class FaceDetectorTask(
  private val mDelegate: FaceDetectorAsyncTaskDelegate,
  private val mFaceDetector: FaceDetectorInterface,
  private val mImageData: ByteArray,
  private val mWidth: Int,
  private val mHeight: Int,
  private val mRotation: Int,
  private val mMirrored: Boolean,
  private val mScaleX: Double,
  private val mScaleY: Double
) {
  fun execute() {
    mFaceDetector.detectFaces(
      mImageData, mWidth, mHeight, mRotation, mMirrored, mScaleX, mScaleY,
      { result ->
        result?.let {
          mDelegate.onFacesDetected(result)
        } ?: run {
          mDelegate.onFaceDetectionError(mFaceDetector)
        }
        mDelegate.onFaceDetectingTaskCompleted()
      },
      { error ->
        mDelegate.onFaceDetectionError(mFaceDetector)
        mDelegate.onFaceDetectingTaskCompleted()
      },
      { skippedReason -> mDelegate.onFaceDetectingTaskCompleted() }
    )
  }
}
