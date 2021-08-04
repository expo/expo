package expo.modules.barcodescanner

import android.hardware.Camera
import android.hardware.Camera.CameraInfo
import android.util.Log
import android.view.Surface
import java.util.*

class ExpoBarCodeScanner(
  private var mActualDeviceOrientation: Int
) {
  private val mCameraInfo: HashMap<Int, CameraInfoWrapper?> = HashMap()
  private val mCameraTypeToIndex: HashMap<Int, Int> = HashMap()
  private val mCameras: MutableSet<Number> = HashSet()

  init {
    // map camera types to camera indexes and collect cameras properties
    repeat(Camera.getNumberOfCameras()) {
      val info = CameraInfo()
      Camera.getCameraInfo(it, info)
      if (info.facing == CameraInfo.CAMERA_FACING_FRONT && mCameraInfo[CAMERA_TYPE_FRONT] == null) {
        mCameraInfo[CAMERA_TYPE_FRONT] = CameraInfoWrapper(info)
        mCameraTypeToIndex[CAMERA_TYPE_FRONT] = it
        mCameras.add(CAMERA_TYPE_FRONT)
      } else if (info.facing == CameraInfo.CAMERA_FACING_BACK && mCameraInfo[CAMERA_TYPE_BACK] == null) {
        mCameraInfo[CAMERA_TYPE_BACK] = CameraInfoWrapper(info)
        mCameraTypeToIndex[CAMERA_TYPE_BACK] = it
        mCameras.add(CAMERA_TYPE_BACK)
      }
    }
  }

  private var mCamera: Camera? = null
  private var mCameraType = 0
  var rotation = 0
    private set

  fun acquireCameraInstance(type: Int): Camera? {
    if (mCamera == null && mCameras.contains(type) && null != mCameraTypeToIndex[type]) {
      try {
        mCameraTypeToIndex[type]?.let {
          mCamera = Camera.open(it)
        }
        mCameraType = type
        adjustPreviewLayout(type)
      } catch (e: Exception) {
        Log.e("ExpoBarCodeScanner", "acquireCameraInstance failed", e)
      }
    }
    return mCamera
  }

  fun releaseCameraInstance() {
    mCamera?.run {
      release()
    }
    mCamera = null
  }

  fun getPreviewWidth(type: Int): Int {
    val cameraInfo = mCameraInfo[type] ?: return 0
    return cameraInfo.previewWidth
  }

  fun getPreviewHeight(type: Int): Int {
    val cameraInfo = mCameraInfo[type] ?: return 0
    return cameraInfo.previewHeight
  }

  fun getBestSize(supportedSizes: List<Camera.Size>, maxWidth: Int, maxHeight: Int) =
    supportedSizes
      .filter { it.width <= maxWidth && it.height <= maxHeight }
      .reduce { acc, size ->
        val resultArea = acc.width * acc.height
        val newArea = size.width * size.height
        if (newArea > resultArea) {
          size
        } else {
          acc
        }
      }

  var actualDeviceOrientation: Int
    get() = mActualDeviceOrientation
    set(actualDeviceOrientation) {
      mActualDeviceOrientation = actualDeviceOrientation
      adjustPreviewLayout(mCameraType)
    }

  fun adjustPreviewLayout(type: Int) {
    mCamera?.run {
      val cameraInfo = mCameraInfo[type] ?: return

      // https://www.captechconsulting.com/blogs/android-camera-orientation-made-simple
      val degrees =
        when (mActualDeviceOrientation) {
          Surface.ROTATION_0 -> 0
          Surface.ROTATION_90 -> 90
          Surface.ROTATION_180 -> 180
          Surface.ROTATION_270 -> 270
          else -> 0
        }
      if (cameraInfo.info.facing == CameraInfo.CAMERA_FACING_FRONT) {
        rotation = (cameraInfo.info.orientation + degrees) % 360
        rotation = (360 - rotation) % 360
      } else {
        rotation = (cameraInfo.info.orientation - degrees + 360) % 360
      }
      setDisplayOrientation(rotation)
      val temporaryParameters = parameters
      temporaryParameters.setRotation(rotation)

      // set preview size
      // Limit preview size to 1920x1920 in order to allow scanning codes on low dpi computer screens
      val optimalPreviewSize = getBestSize(temporaryParameters.supportedPreviewSizes, 1920, 1920)
      val width = optimalPreviewSize.width
      val height = optimalPreviewSize.height
      temporaryParameters.setPreviewSize(width, height)
      try {
        parameters = temporaryParameters
      } catch (e: Exception) {
        e.printStackTrace()
      }
      cameraInfo.previewHeight = height
      cameraInfo.previewWidth = width
      if (rotation == 90 || rotation == 270) {
        cameraInfo.previewHeight = width
        cameraInfo.previewWidth = height
      }
    }
  }

  private inner class CameraInfoWrapper(val info: CameraInfo) {
    var rotation = 0
    var previewWidth = -1
    var previewHeight = -1
  }

  companion object {
    const val CAMERA_TYPE_FRONT = 1
    const val CAMERA_TYPE_BACK = 2
    private var innerInstance: ExpoBarCodeScanner? = null

    val instance: ExpoBarCodeScanner
      get() = requireNotNull(innerInstance) { "Bar code scanner needs to be initialized" }

    fun createInstance(deviceOrientation: Int) {
      innerInstance = ExpoBarCodeScanner(deviceOrientation)
    }
  }
}
