package expo.modules.barcodescanner

import android.content.Context
import android.graphics.SurfaceTexture
import android.hardware.Camera
import android.hardware.Camera.PreviewCallback
import android.os.AsyncTask
import android.os.Handler
import android.os.Looper
import android.view.TextureView
import android.view.TextureView.SurfaceTextureListener
import expo.modules.core.ModuleRegistry
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings

internal class BarCodeScannerViewFinder(
  context: Context,
  private var cameraType: Int,
  private var barCodeScannerView: BarCodeScannerView,
  private val moduleRegistry: ModuleRegistry
) : TextureView(context), SurfaceTextureListener, PreviewCallback {
  private var mSurfaceTexture: SurfaceTexture? = null

  @Volatile
  private var mIsStarting = false

  @Volatile
  private var mIsStopping = false

  @Volatile
  private var mIsChanging = false
  private var mCamera: Camera? = null

  // Scanner instance for the barcode scanning
  private lateinit var mBarCodeScanner: BarCodeScannerInterface
  override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
    mSurfaceTexture = surface
    startCamera()
  }

  override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {}
  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    mSurfaceTexture = null
    stopCamera()
    return true
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
    mSurfaceTexture = surface
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
      mIsChanging = true
      stopPreview()
      cameraType = type
      startPreview()
      mIsChanging = false
    }.start()
  }

  private fun startPreview() {
    if (mSurfaceTexture != null) {
      startCamera()
    }
  }

  private fun stopPreview() {
    if (mCamera != null) {
      stopCamera()
    }
  }

  @Synchronized
  private fun startCamera() {
    if (!mIsStarting) {
      mIsStarting = true
      try {
        ExpoBarCodeScanner.instance?.acquireCameraInstance(cameraType)?.run {
          val parameters = this.parameters
          // set autofocus
          val focusModes = parameters.supportedFocusModes
          if (focusModes != null && focusModes.contains(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE)) {
            parameters.focusMode = Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE
          }
          // set picture size
          // defaults to max available size
          val optimalPictureSize =
            ExpoBarCodeScanner.instance.getBestSize(
              parameters.supportedPictureSizes,
              Int.MAX_VALUE,
              Int.MAX_VALUE
            )
          parameters?.setPictureSize(optimalPictureSize.width, optimalPictureSize.height)
          this.parameters = parameters
          this.setPreviewTexture(mSurfaceTexture)
          this.startPreview()
          // send previews to `onPreviewFrame`
          this.setPreviewCallback(this@BarCodeScannerViewFinder)
          barCodeScannerView.layoutViewFinder()
        }
      } catch (e: NullPointerException) {
        e.printStackTrace()
      } catch (e: Exception) {
        e.printStackTrace()
        stopCamera()
      } finally {
        mIsStarting = false
      }
    }
  }

  @Synchronized
  private fun stopCamera() {
    if (!mIsStopping) {
      mIsStopping = true
      try {
        mCamera?.run {
          this.stopPreview()
          // stop sending previews to `onPreviewFrame`
          this.setPreviewCallback(null)
          ExpoBarCodeScanner.instance.releaseCameraInstance()
        }
        mCamera = null
      } catch (e: Exception) {
        e.printStackTrace()
      } finally {
        mIsStopping = false
      }
    }
  }

  /**
   * Initialize the barcode decoder.
   * Supports all iOS codes except [code138, code39mod43, interleaved2of5]
   * Additionally supports [codabar, code128, upc_a]
   */
  private fun initBarCodeScanner() {
    val barCodeScannerProvider = moduleRegistry.getModule(BarCodeScannerProviderInterface::class.java)
    if (barCodeScannerProvider != null) {
      mBarCodeScanner = barCodeScannerProvider.createBarCodeDetectorWithContext(context)
    }
  }

  override fun onPreviewFrame(data: ByteArray, camera: Camera) {
    if (!barCodeScannerTaskLock) {
      barCodeScannerTaskLock = true
      BarCodeScannerAsyncTask(camera, data, barCodeScannerView).execute()
    }
  }

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings?) {
    mBarCodeScanner.setSettings(settings)
  }

  private inner class BarCodeScannerAsyncTask(private val mCamera: Camera?, private val mImageData: ByteArray, barCodeScannerView: BarCodeScannerView) : AsyncTask<Void?, Void?, Void?>() {
    init {
      this@BarCodeScannerViewFinder.barCodeScannerView = barCodeScannerView
    }

    override fun doInBackground(vararg params: Void?): Void? {
      if (isCancelled) {
        return null
      }

      // setting PreviewCallback does not really have an effect - this method is called anyway so we
      // need to check if camera changing is in progress or not
      if (!mIsChanging && mCamera != null) {
        val size = mCamera.parameters.previewSize
        val width = size.width
        val height = size.height
        val properRotation = ExpoBarCodeScanner.instance.rotation
        val result = mBarCodeScanner.scan(
          mImageData, width,
          height, properRotation
        )
        if (result != null) {
          Handler(Looper.getMainLooper()).post { barCodeScannerView.onBarCodeScanned(result) }
        }
      }
      barCodeScannerTaskLock = false
      return null
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
