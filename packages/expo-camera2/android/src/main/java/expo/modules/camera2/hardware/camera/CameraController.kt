package expo.modules.camera2.hardware.camera

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.camera2.*
import android.os.Handler
import android.os.HandlerThread
import android.support.annotation.WorkerThread

import expo.modules.camera2.hardware.orientation.*
import expo.modules.camera2.hardware.orientation.computeDisplayOrientation
import expo.modules.camera2.hardware.orientation.computeImageOrientation

import expo.modules.camera2.utils.getCameraManager
import expo.modules.camera2.preview.Preview

import java.util.concurrent.Executor

/**
 * Controller for [CameraDevice]
 */
class CameraController(
  context: Context,
  val cameraId: String,
  val executor: Executor
) {
  companion object {
    private val sWorkerHandler: Handler

    init {
      // Initialize a single worker thread. This can be static since only a single camera reference can exist at a time.
      val workerThread = HandlerThread("CameraControllerWorker")
      workerThread.isDaemon = true
      workerThread.start()
      sWorkerHandler = Handler(workerThread.looper)
    }
  }

  private val cameraManager = context.getCameraManager()
  private val cameraCharacteristics = CameraDeviceCharacteristics(cameraManager, cameraId)
  private var configuration: CameraConfiguration = CameraConfiguration.DEFAULT

  private lateinit var preview: Preview

  private var cameraDevice: CameraDevice? = null

  /**
   * Callbacks for [openCamera]
   */
  private val cameraDeviceCallback = object : CameraDevice.StateCallback() {
    override fun onOpened(camera: CameraDevice) {
      cameraDevice = camera
      createCameraCaptureSession()
    }

    override fun onDisconnected(camera: CameraDevice) {
      if (cameraDevice == camera) {
        cameraDevice = null
      }
      camera.close()
    }

    override fun onError(camera: CameraDevice, error: Int) {
      TODO()
    }
  }

  private lateinit var cameraCaptureSession: CameraCaptureSession
  private lateinit var previewRequestBuilder: CaptureRequest.Builder

  /**
   * Callbacks for [createCameraCaptureSession]
   */
  private val cameraCaptureSessionCallback = object : CameraCaptureSession.StateCallback() {
    override fun onConfigured(session: CameraCaptureSession) {
      // The camera is already closed
      if (cameraDevice == null) {
        return
      }

      cameraCaptureSession = session
      configureCameraCaptureSession()
    }

    override fun onConfigureFailed(session: CameraCaptureSession) {
      TODO()
    }

    override fun onClosed(session: CameraCaptureSession) {
//      TODO()
    }
  }


  private var displayOrientation: Orientation = Orientation.Vertical.Portrait
  private var imageOrientation: Orientation = Orientation.Vertical.Portrait
  private var previewOrientation: Orientation = Orientation.Vertical.Portrait

  fun getFacing() = cameraCharacteristics.facing

  fun getAvailablePreviewSizes() = cameraCharacteristics.availablePreviewSizes

  /**
   * (1) Open camera
   */
  @SuppressLint("MissingPermission")
  fun openCamera() {
    cameraManager.openCamera(cameraId, cameraDeviceCallback, sWorkerHandler)
  }

  fun closeCamera() {
    cameraDevice?.close()
  }

  /**
   * (2) Camera opened - creating capture session
   */
  @WorkerThread
  private fun createCameraCaptureSession() {
    try {
      val previewSurface = preview.getSurface()
      cameraDevice?.createCaptureSession(listOf(previewSurface), cameraCaptureSessionCallback, sWorkerHandler) ?: TODO("cameraDevice is null")
    } catch (e: CameraAccessException) {
      // shouldn't happen
      TODO()
    }
  }

  /**
   * (3) Camera session created and we can make requests against camera device
   */
  @WorkerThread
  private fun configureCameraCaptureSession() {
    try {
      previewRequestBuilder = cameraDevice!!.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
      previewRequestBuilder.addTarget(preview.getSurface())
      previewRequestBuilder.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
      val previewRequest = previewRequestBuilder.build()
      cameraCaptureSession.setRepeatingRequest(previewRequest, null, sWorkerHandler)
    } catch (e: CameraAccessException) {
      // shouldn't happen
      TODO()
    }
  }

  fun updateConfiguration(configuration: CameraConfiguration) {
    this.configuration = configuration
  }

  fun setDisplayOrientation(orientationState: OrientationState) {
    imageOrientation = computeImageOrientation(
      deviceOrientation = orientationState.deviceOrientation,
      cameraOrientation = cameraCharacteristics.orientation,
      cameraIsMirrored = cameraCharacteristics.isMirrored
    )

    displayOrientation = computeDisplayOrientation(
      screenOrientation = orientationState.screenOrientation,
      cameraOrientation = cameraCharacteristics.orientation,
      cameraIsMirrored = cameraCharacteristics.isMirrored
    )

    previewOrientation = computePreviewOrientation(
      screenOrientation = orientationState.screenOrientation,
      cameraOrientation = cameraCharacteristics.orientation,
      cameraIsMirrored = cameraCharacteristics.isMirrored
    )

    preview.setOrientation(previewOrientation)
  }

  fun stopPreview() {
    TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
  }

  fun attachPreview(preview: Preview) {
    this.preview = preview
  }
}
