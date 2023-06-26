package expo.modules.barcodescanner

import android.content.Context
import android.hardware.SensorManager
import android.os.Bundle
import android.util.Pair
import android.view.OrientationEventListener
import android.view.View
import android.view.WindowManager
import androidx.core.util.component1
import androidx.core.util.component2
import expo.modules.barcodescanner.utils.mapX
import expo.modules.barcodescanner.utils.mapY
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.roundToInt

class BarCodeScannerView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private val onBarCodeScanned by EventDispatcher<BarCodeScannedEvent>(
    coalescingKey = { event -> (event.data.hashCode() % Short.MAX_VALUE).toShort() }
  )

  private val orientationListener = object : OrientationEventListener(
    context,
    SensorManager.SENSOR_DELAY_NORMAL
  ) {
    override fun onOrientationChanged(orientation: Int) {
      if (setActualDeviceOrientation()) {
        layoutViewFinder()
      }
    }
  }.apply {
    if (canDetectOrientation()) enable() else disable()
  }

  private var viewFinder: BarCodeScannerViewFinder
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
    transformBarCodeScannerResultToViewCoordinates(barCode)
    val (cornerPoints, boundingBox) = getCornerPointsAndBoundingBox(barCode.cornerPoints, barCode.boundingBox)
    onBarCodeScanned(
      BarCodeScannedEvent(
        target = id,
        data = barCode.value,
        type = barCode.type,
        cornerPoints = cornerPoints,
        bounds = boundingBox
      )
    )
  }

  private val displayDensity: Float
    get() = resources.displayMetrics.density

  private fun transformBarCodeScannerResultToViewCoordinates(barCode: BarCodeScannerResult) {
    val cornerPoints = barCode.cornerPoints
    val previewWidth = width - leftPadding * 2
    val previewHeight = height - topPadding * 2

    // fix for problem with rotation when front camera is in use
    if (type == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && getDeviceOrientation() % 2 == 0) {
      cornerPoints.mapY { barCode.referenceImageHeight - cornerPoints[it] }
    }
    if (type == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && getDeviceOrientation() % 2 != 0) {
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

  private fun getCornerPointsAndBoundingBox(
    cornerPoints: List<Int>,
    boundingBox: BarCodeScannerResult.BoundingBox,
  ): Pair<ArrayList<Bundle>, Bundle> {
    val convertedCornerPoints = ArrayList<Bundle>()
    for (i in cornerPoints.indices step 2) {
      val x = cornerPoints[i].toFloat() / displayDensity
      val y = cornerPoints[i + 1].toFloat() / displayDensity

      convertedCornerPoints.add(
        Bundle().apply {
          putFloat("x", x)
          putFloat("y", y)
        }
      )
    }
    val boundingBoxBundle = Bundle().apply {
      putParcelable(
        "origin",
        Bundle().apply {
          putFloat("x", boundingBox.x.toFloat() / displayDensity)
          putFloat("y", boundingBox.y.toFloat() / displayDensity)
        }
      )
      putParcelable(
        "size",
        Bundle().apply {
          putFloat("width", boundingBox.width.toFloat() / displayDensity)
          putFloat("height", boundingBox.height.toFloat() / displayDensity)
        }
      )
    }
    return Pair(convertedCornerPoints, boundingBoxBundle)
  }

  fun setCameraType(cameraType: Int) {
    type = cameraType
    viewFinder.setCameraType(cameraType)
    ExpoBarCodeScanner.instance.adjustPreviewLayout(cameraType)
  }

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings?) {
    viewFinder.setBarCodeScannerSettings(settings)
  }

  private fun setActualDeviceOrientation(): Boolean {
    val innerActualDeviceOrientation = getDeviceOrientation()
    return if (actualDeviceOrientation != innerActualDeviceOrientation) {
      actualDeviceOrientation = innerActualDeviceOrientation
      ExpoBarCodeScanner.instance.actualDeviceOrientation = actualDeviceOrientation
      true
    } else {
      false
    }
  }

  private fun getDeviceOrientation() =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation

  fun layoutViewFinder() {
    layoutViewFinder(left, top, right, bottom)
  }

  private fun layoutViewFinder(left: Int, top: Int, right: Int, bottom: Int) {
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
    ExpoBarCodeScanner.createInstance(getDeviceOrientation())
    viewFinder = BarCodeScannerViewFinder(
      context,
      type,
      this,
      appContext
    )
    addView(viewFinder)
  }
}
