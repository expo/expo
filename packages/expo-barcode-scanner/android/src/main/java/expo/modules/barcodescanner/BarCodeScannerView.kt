package expo.modules.barcodescanner

import android.content.Context
import android.hardware.SensorManager
import android.view.OrientationEventListener
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import expo.modules.barcodescanner.BarCodeScannedEvent.Companion.obtain
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import kotlin.math.roundToInt

class BarCodeScannerView(
  private val mContext: Context,
  private val mModuleRegistry: ModuleRegistry
) : ViewGroup(mContext) {
  private val mOrientationListener: OrientationEventListener
  private lateinit var mViewFinder: BarCodeScannerViewFinder
  private var mActualDeviceOrientation = -1
  private var mLeftPadding = 0
  private var mTopPadding = 0
  private var mType = 0
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    mOrientationListener.disable()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    layoutViewFinder(left, top, right, bottom)
  }

  override fun onViewAdded(child: View) {
    if (mViewFinder == child) return
    // remove and read view to make sure it is in the back.
    // @TODO figure out why there was a z order issue in the first place and fix accordingly.
    removeView(mViewFinder)
    this.addView(mViewFinder, 0)
  }

  fun onBarCodeScanned(barCode: BarCodeScannerResult) {
    val emitter = mModuleRegistry.getModule(EventEmitter::class.java)
    transformBarCodeScannerResultToViewCoordinates(barCode)
    val event = obtain(this.id, barCode, displayDensity)
    emitter.emit(this.id, event)
  }

  private val displayDensity: Float
    get() = this.resources.displayMetrics.density

  private fun transformBarCodeScannerResultToViewCoordinates(barCode: BarCodeScannerResult) {
    val cornerPoints = barCode.cornerPoints
    val previewWidth = this.width - mLeftPadding * 2
    val previewHeight = this.height - mTopPadding * 2

    // fix for problem with rotation when front camera is in use
    if (mType == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && getDeviceOrientation(mContext) % 2 == 0) {
      var i = 1
      while (i < cornerPoints.size) {
        // convert y-coordinate
        val convertedCoordinate = barCode.referenceImageHeight - cornerPoints[i]
        cornerPoints[i] = convertedCoordinate
        i += 2
      }
    }
    if (mType == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && getDeviceOrientation(mContext) % 2 != 0) {
      var i = 0
      while (i < cornerPoints.size) {
        // convert y-coordinate
        val convertedCoordinate = barCode.referenceImageWidth - cornerPoints[i]
        cornerPoints[i] = convertedCoordinate
        i += 2
      }
    }
    // end of fix
    run {
      var i = 0
      while (i < cornerPoints.size) {
        // convert x-coordinate
        val convertedCoordinate = (cornerPoints[i] * previewWidth / barCode.referenceImageWidth.toFloat() + mLeftPadding).roundToInt()
        cornerPoints[i] = convertedCoordinate
        i += 2
      }
    }
    var i = 1
    while (i < cornerPoints.size) {
      // convert y-coordinate
      val convertedCoordinate = (cornerPoints[i] * previewHeight / barCode.referenceImageHeight.toFloat() + mTopPadding).roundToInt()
      cornerPoints[i] = convertedCoordinate
      i += 2
    }
    barCode.referenceImageHeight = this.height
    barCode.referenceImageWidth = this.width
    barCode.cornerPoints = cornerPoints
  }

  fun setCameraType(type: Int) {
    mType = type
    if (!::mViewFinder.isInitialized) {
      mViewFinder.setCameraType(type)
      ExpoBarCodeScanner.instance.adjustPreviewLayout(type)
    } else {
      mViewFinder = BarCodeScannerViewFinder(mContext, type, this, mModuleRegistry)
      addView(mViewFinder)
    }
  }

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings?) {
    mViewFinder.setBarCodeScannerSettings(settings)
  }

  private fun setActualDeviceOrientation(context: Context): Boolean {
    val actualDeviceOrientation = getDeviceOrientation(context)
    return if (mActualDeviceOrientation != actualDeviceOrientation) {
      mActualDeviceOrientation = actualDeviceOrientation
      ExpoBarCodeScanner.instance.actualDeviceOrientation = mActualDeviceOrientation
      true
    } else {
      false
    }
  }

  private fun getDeviceOrientation(context: Context) =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation

  fun layoutViewFinder() {
    layoutViewFinder(this.left, this.top, this.right, this.bottom)
  }

  private fun layoutViewFinder(left: Int, top: Int, right: Int, bottom: Int) {
    if (!::mViewFinder.isInitialized) {
      return
    }
    val width = (right - left).toFloat()
    val height = (bottom - top).toFloat()
    val viewfinderWidth: Int
    val viewfinderHeight: Int
    val ratio = mViewFinder.ratio

    // Just fill the given space
    if (ratio * height < width) {
      viewfinderWidth = (ratio * height).toInt()
      viewfinderHeight = height.toInt()
    } else {
      viewfinderHeight = (width / ratio).toInt()
      viewfinderWidth = width.toInt()
    }
    val viewFinderPaddingX = ((width - viewfinderWidth) / 2).toInt()
    val viewFinderPaddingY = ((height - viewfinderHeight) / 2).toInt()
    mLeftPadding = viewFinderPaddingX
    mTopPadding = viewFinderPaddingY
    mViewFinder.layout(viewFinderPaddingX, viewFinderPaddingY, viewFinderPaddingX + viewfinderWidth, viewFinderPaddingY + viewfinderHeight)
    this.postInvalidate(left, top, right, bottom)
  }

  init {
    ExpoBarCodeScanner.createInstance(getDeviceOrientation(mContext))
    mOrientationListener = object : OrientationEventListener(mContext, SensorManager.SENSOR_DELAY_NORMAL) {
      override fun onOrientationChanged(orientation: Int) {
        if (setActualDeviceOrientation(mContext)) {
          layoutViewFinder()
        }
      }
    }
    if (mOrientationListener.canDetectOrientation()) {
      mOrientationListener.enable()
    } else {
      mOrientationListener.disable()
    }
  }
}
