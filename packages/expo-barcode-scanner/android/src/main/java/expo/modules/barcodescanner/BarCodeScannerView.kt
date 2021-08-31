package expo.modules.barcodescanner

import android.content.Context
import android.hardware.SensorManager
import android.view.OrientationEventListener
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import expo.modules.barcodescanner.BarCodeScannedEvent.Companion.obtain
import expo.modules.barcodescanner.utils.mapX
import expo.modules.barcodescanner.utils.mapY
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import kotlin.math.roundToInt

class BarCodeScannerView(
  private val viewContext: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate
) : ViewGroup(viewContext) {
  private val orientationListener = object : OrientationEventListener(
    viewContext,
    SensorManager.SENSOR_DELAY_NORMAL
  ) {
    override fun onOrientationChanged(orientation: Int) {
      if (setActualDeviceOrientation(viewContext)) {
        layoutViewFinder()
      }
    }
  }.apply {
    if (canDetectOrientation()) enable() else disable()
  }

  private inline fun <reified T> moduleRegistry() =
    moduleRegistryDelegate.getFromModuleRegistry<T>()

  private lateinit var viewFinder: BarCodeScannerViewFinder
  private var actualDeviceOrientation = -1
  private var leftPadding = 0
  private var topPadding = 0
  private var type = 0

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    orientationListener.disable()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    layoutViewFinder(left, top, right, bottom)
  }

  override fun onViewAdded(child: View) {
    if (viewFinder == child) return
    // remove and read view to make sure it is in the back.
    // @TODO figure out why there was a z order issue in the first place and fix accordingly.
    removeView(viewFinder)
    addView(viewFinder, 0)
  }

  fun onBarCodeScanned(barCode: BarCodeScannerResult) {
    val emitter: EventEmitter by moduleRegistry()
    transformBarCodeScannerResultToViewCoordinates(barCode)
    val event = obtain(id, barCode, displayDensity)
    emitter.emit(id, event)
  }

  private val displayDensity: Float
    get() = resources.displayMetrics.density

  private fun transformBarCodeScannerResultToViewCoordinates(barCode: BarCodeScannerResult) {
    val cornerPoints = barCode.cornerPoints
    val previewWidth = width - leftPadding * 2
    val previewHeight = height - topPadding * 2

    // fix for problem with rotation when front camera is in use
    if (type == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && getDeviceOrientation(viewContext) % 2 == 0) {
      cornerPoints.mapY { barCode.referenceImageHeight - cornerPoints[it] }
    }
    if (type == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && getDeviceOrientation(viewContext) % 2 != 0) {
      cornerPoints.mapX { barCode.referenceImageWidth - cornerPoints[it] }
    }
    // end of fix
    cornerPoints.mapX {
      (cornerPoints[it] * previewWidth / barCode.referenceImageWidth.toFloat() + leftPadding)
        .roundToInt()
    }
    cornerPoints.mapY {
      (cornerPoints[it] * previewHeight / barCode.referenceImageHeight.toFloat() + topPadding)
        .roundToInt()
    }
    barCode.referenceImageHeight = height
    barCode.referenceImageWidth = width
    barCode.cornerPoints = cornerPoints
  }

  fun setCameraType(cameraType: Int) {
    type = cameraType
    if (!::viewFinder.isInitialized) {
      viewFinder = BarCodeScannerViewFinder(
        viewContext,
        cameraType,
        this,
        moduleRegistryDelegate
      )
      addView(viewFinder)
    } else {
      viewFinder.setCameraType(cameraType)
      ExpoBarCodeScanner.instance.adjustPreviewLayout(cameraType)
    }
  }

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings?) {
    viewFinder.setBarCodeScannerSettings(settings)
  }

  private fun setActualDeviceOrientation(context: Context): Boolean {
    val innerActualDeviceOrientation = getDeviceOrientation(context)
    return if (actualDeviceOrientation != innerActualDeviceOrientation) {
      actualDeviceOrientation = innerActualDeviceOrientation
      ExpoBarCodeScanner.instance.actualDeviceOrientation = actualDeviceOrientation
      true
    } else {
      false
    }
  }

  private fun getDeviceOrientation(context: Context) =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation

  fun layoutViewFinder() {
    layoutViewFinder(left, top, right, bottom)
  }

  private fun layoutViewFinder(left: Int, top: Int, right: Int, bottom: Int) {
    if (!::viewFinder.isInitialized) {
      return
    }
    val width = (right - left).toFloat()
    val height = (bottom - top).toFloat()
    val viewfinderWidth: Int
    val viewfinderHeight: Int
    val ratio = viewFinder.ratio

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
    leftPadding = viewFinderPaddingX
    topPadding = viewFinderPaddingY
    viewFinder.layout(viewFinderPaddingX, viewFinderPaddingY, viewFinderPaddingX + viewfinderWidth, viewFinderPaddingY + viewfinderHeight)
    postInvalidate(left, top, right, bottom)
  }

  init {
    ExpoBarCodeScanner.createInstance(getDeviceOrientation(viewContext))
  }
}
