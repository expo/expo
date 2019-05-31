package expo.modules.camera2

import android.support.annotation.FloatRange

import expo.modules.camera2.exception.CameraException
import expo.modules.camera2.settings.*

/**
 * Interface describing Camera View
 */
interface Camera2 {

  // region Camera Configuration

  interface LifecycleListener {
    fun onCameraOpened()
    fun onCameraClosed()
  }

  fun setLifecycleListener(listener: LifecycleListener)

  fun setFacing(facing: Facing)

  fun setFlash(flash: Flash)

  fun setHDR(hdr: HDR)

  fun setAutofocus(autofocus: Autofocus)

  fun setMode(mode: Mode)

  /**
   * @param focusDepth should be between 0.0 (infinity focus) and 1.0 (focus as close as possible)
   */
  fun setFocusDepth(@FloatRange(from = 0.0, to = 1.0) focusDepth: Float)

  /**
   * @param zoom should be between 0.0 (not zoomed) and 1.0 (maximum zoom)
   */
  fun setZoom(@FloatRange(from = 0.0, to  = 1.0) zoom: Float)

  fun setWhiteBalance(whiteBalance: WhiteBalance)

  // endregion


  // region Picture cameraConfiguration

  fun setPictureSize(pictureSize: Float)

  // endregion


  // region Lifecycle methods

  fun startCamera()

  fun stopCamera()

  fun startPreview()

  fun pausePreview()

  fun resumePreview()

  fun stopPreview()

  fun restartPreview()

  // endregion


  // region Functionalities

  fun takePicture()

  fun record()

  fun stopRecording()

  fun getAvailablePictureSizes()

  /**
   * Will instruct camera device to focus at given point (x, y) on preview
   *
   * @param x should be between 0.0 and 1.0
   * @param y should be between 0.0 and 1.0
   */
  fun focusAt(x: Float, y: Float)

  // endregion

}
