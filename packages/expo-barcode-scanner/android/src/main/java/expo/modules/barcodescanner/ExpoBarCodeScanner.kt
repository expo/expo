package expo.modules.barcodescanner

import android.hardware.Camera
import android.hardware.Camera.CameraInfo
import android.util.Log
import android.view.Surface

class ExpoBarCodeScanner(
  private var mActualDeviceOrientation: Int
) {
  private val cameraInfo: HashMap<Int, CameraInfoWrapper?> = HashMap()
  private val cameraTypeToIndex: HashMap<Int, Int> = HashMap()
  private val cameras: MutableSet<Number> = HashSet()

  init {
    // map camera types to camera indexes and collect cameras properties
    repeat(Camera.getNumberOfCameras()) {
      val info = CameraInfo()
      Camera.getCameraInfo(it, info)
      if (info.facing == CameraInfo.CAMERA_FACING_FRONT && cameraInfo[CAMERA_TYPE_FRONT] == null) {
        cameraInfo[CAMERA_TYPE_FRONT] = CameraInfoWrapper(info)
        cameraTypeToIndex[CAMERA_TYPE_FRONT] = it
        cameras.add(CAMERA_TYPE_FRONT)
      } else if (info.facing == CameraInfo.CAMERA_FACING_BACK && cameraInfo[CAMERA_TYPE_BACK] == null) {
        cameraInfo[CAMERA_TYPE_BACK] = CameraInfoWrapper(info)
        cameraTypeToIndex[CAMERA_TYPE_BACK] = it
        cameras.add(CAMERA_TYPE_BACK)
      }
    }
  }

  private var camera: Camera? = null
  private var cameraType = 0
  var rotation = 0
    private set

  fun acquireCameraInstance(type: Int): Camera? {
    if (camera == null && cameras.contains(type) && null != cameraTypeToIndex[type]) {
      try {
        cameraTypeToIndex[type]?.let {
          camera = Camera.open(it)
        }
        cameraType = type
        adjustPreviewLayout(type)
      } catch (e: Exception) {
        Log.e("ExpoBarCodeScanner", "acquireCameraInstance failed", e)
      }
    }
    return camera
  }

  fun releaseCameraInstance() {
    camera?.run {
      release()
    }
    camera = null
  }

  fun getPreviewWidth(type: Int): Int {
    return cameraInfo[type]?.previewWidth ?: 0
  }

  fun getPreviewHeight(type: Int): Int {
    return cameraInfo[type]?.previewHeight ?: 0
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
      adjustPreviewLayout(cameraType)
    }

  fun adjustPreviewLayout(type: Int) {
    camera?.run {
      val tmpCameraInfo = cameraInfo[type] ?: return

      // https://www.captechconsulting.com/blogs/android-camera-orientation-made-simple
      val degrees =
        when (mActualDeviceOrientation) {
          Surface.ROTATION_0 -> 0
          Surface.ROTATION_90 -> 90
          Surface.ROTATION_180 -> 180
          Surface.ROTATION_270 -> 270
          else -> 0
        }
      if (tmpCameraInfo.info.facing == CameraInfo.CAMERA_FACING_FRONT) {
        rotation = (tmpCameraInfo.info.orientation + degrees) % 360
        rotation = (360 - rotation) % 360
      } else {
        rotation = (tmpCameraInfo.info.orientation - degrees + 360) % 360
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
      tmpCameraInfo.previewHeight = height
      tmpCameraInfo.previewWidth = width
      if (rotation == 90 || rotation == 270) {
        tmpCameraInfo.previewHeight = width
        tmpCameraInfo.previewWidth = height
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
