package expo.modules.barcodescanner

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.SurfaceTexture
import android.hardware.Camera
import android.hardware.Camera.PreviewCallback
import android.util.Log
import android.view.TextureView
import android.view.TextureView.SurfaceTextureListener
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.kotlin.AppContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@SuppressLint("ViewConstructor")
internal class BarCodeScannerViewFinder(
  context: Context,
  private var cameraType: Int,
  private var barCodeScannerView: BarCodeScannerView,
  private val appContext: AppContext,
) : TextureView(context), SurfaceTextureListener, PreviewCallback {
  private var finderSurfaceTexture: SurfaceTexture? = null
  private val coroutineScope = CoroutineScope(Dispatchers.Default)

  @Volatile
  private var isStarting = false

  @Volatile
  private var isStopping = false

  @Volatile
  private var isChanging = false
  private var camera: Camera? = null

  // Scanner instance for the barcode scanning
  private var barCodeScanner: BarCodeScannerInterface? = null

  override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
    finderSurfaceTexture = surface
    startCamera()
  }

  override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) = Unit

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    finderSurfaceTexture = null
    stopCamera()
    try {
      coroutineScope.cancel(ModuleDestroyedException("View destroyed, scope canceled"))
    } catch (e: Exception) {
      Log.w("ScannerViewFinder", e.message ?: "", e)
    }
    return true
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
    finderSurfaceTexture = surface
  }

  val ratio: Double
    get() {
      val width = ExpoBarCodeScanner.instance.getPreviewWidth(cameraType)
      val height = ExpoBarCodeScanner.instance.getPreviewHeight(cameraType)
      return (width.toFloat() / height.toFloat()).toDouble()
    }

  fun setCameraType(type: Int) {
    if (cameraType == type) {
      return
    }
    Thread {
      isChanging = true
      stopPreview()
      cameraType = type
      startPreview()
      isChanging = false
    }.start()
  }

  private fun startPreview() {
    if (finderSurfaceTexture != null) {
      startCamera()
    }
  }

  private fun stopPreview() {
    if (camera != null) {
      stopCamera()
    }
  }

  @Synchronized
  private fun startCamera() {
    if (!isStarting && !isStopping) {
      isStarting = true
      try {
        camera = ExpoBarCodeScanner.instance.acquireCameraInstance(cameraType)
        camera?.run {
          val temporaryParameters = parameters
          // set autofocus
          val focusModes = temporaryParameters.supportedFocusModes
          if (focusModes != null && focusModes.contains(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE)) {
            temporaryParameters.focusMode = Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE
          }
          // set picture size
          // defaults to max available size
          val optimalPictureSize =
            ExpoBarCodeScanner.instance.getBestSize(
              temporaryParameters.supportedPictureSizes,
              Int.MAX_VALUE,
              Int.MAX_VALUE
            )
          temporaryParameters?.setPictureSize(optimalPictureSize.width, optimalPictureSize.height)
          parameters = temporaryParameters
          setPreviewTexture(finderSurfaceTexture)
          startPreview()
          // send previews to `onPreviewFrame`
          setPreviewCallback(this@BarCodeScannerViewFinder)
          barCodeScannerView.layoutViewFinder()
        }
      } catch (e: NullPointerException) {
        e.printStackTrace()
      } catch (e: Exception) {
        e.printStackTrace()
        stopCamera()
      } finally {
        isStarting = false
      }
    }
  }

  @Synchronized
  private fun stopCamera() {
    if (!isStopping) {
      isStopping = true
      try {
        camera?.run {
          stopPreview()
          // stop sending previews to `onPreviewFrame`
          setPreviewCallback(null)
          ExpoBarCodeScanner.instance.releaseCameraInstance()
        }
        camera = null
      } catch (e: Exception) {
        e.printStackTrace()
      } finally {
        isStopping = false
      }
    }
  }

  /**
   * Initialize the barcode decoder.
   * Supports all iOS codes except [code138, code39mod43, interleaved2of5]
   * Additionally supports [codabar, code128, upc_a]
   */
  private fun initBarCodeScanner() {
    val barCodeScannerProvider = appContext.legacyModule<BarCodeScannerProviderInterface>()
    barCodeScanner = barCodeScannerProvider?.createBarCodeDetectorWithContext(context)
  }

  override fun onPreviewFrame(data: ByteArray, innerCamera: Camera) {
    if (!barCodeScannerTaskLock) {
      barCodeScannerTaskLock = true
      scanForBarcodes(innerCamera, data)
    }
  }

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings?) {
    barCodeScanner?.setSettings(settings)
  }

  private fun scanForBarcodes(camera: Camera?, mImageData: ByteArray) {
    if (!coroutineScope.isActive) {
      barCodeScannerTaskLock = false
      return
    }

    coroutineScope.launch {
      try {
        if (!coroutineScope.isActive) {
          return@launch
        }

        // setting PreviewCallback does not really have an effect - this method is called anyway
        // so we need to check if camera changing is in progress or not
        if (!isChanging && camera != null) {
          val size = camera.parameters.previewSize
          val width = size.width
          val height = size.height
          val properRotation = ExpoBarCodeScanner.instance.rotation
          val result = barCodeScanner?.scan(
            mImageData, width,
            height, properRotation
          )
          if (result != null) {
            withContext(Dispatchers.Main) {
              launch {
                if (coroutineScope.isActive) {
                  barCodeScannerView.onBarCodeScanned(result)
                }
              }
            }
          }
        }
      } catch (e: ModuleDestroyedException) {
        Log.w("BarCodeScanner", e.message ?: "", e)
      } finally {
        barCodeScannerTaskLock = false
      }
    }
  }

  companion object {
    // Concurrency lock for barcode scanner to avoid flooding the runtime
    @Volatile
    var barCodeScannerTaskLock = false
  }

  init {
    surfaceTextureListener = this
    initBarCodeScanner()
  }
}
