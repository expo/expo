package expo.modules.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import com.google.android.cameraview.CameraView
import expo.modules.camera.CameraViewHelper.getCamcorderProfile
import expo.modules.camera.CameraViewHelper.getCorrectCameraRotation
import expo.modules.camera.tasks.BarCodeScannerAsyncTask
import expo.modules.camera.tasks.BarCodeScannerAsyncTaskDelegate
import expo.modules.camera.tasks.FaceDetectorAsyncTaskDelegate
import expo.modules.camera.tasks.FaceDetectorTask
import expo.modules.camera.tasks.PictureSavedDelegate
import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask
import expo.modules.camera.utils.FileSystemUtils
import expo.modules.camera.utils.ImageDimensions
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.interfaces.facedetector.FaceDetectorInterface
import expo.modules.interfaces.facedetector.FaceDetectorProviderInterface
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.callbacks.callback
import java.io.File
import java.io.IOException
import java.lang.ref.WeakReference
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedQueue

class ExpoCameraView(
  themedReactContext: Context,
  private val appContext: WeakReference<AppContext>,
) : CameraView(themedReactContext, true),
  LifecycleEventListener,
  BarCodeScannerAsyncTaskDelegate,
  FaceDetectorAsyncTaskDelegate,
  PictureSavedDelegate,
  CameraViewInterface {

  private val pictureTakenPromises: Queue<Promise> = ConcurrentLinkedQueue()
  private val pictureTakenOptions: MutableMap<Promise, PictureOptions> = ConcurrentHashMap()
  private val pictureTakenDirectories: MutableMap<Promise, File> = ConcurrentHashMap()
  private var videoRecordedPromise: Promise? = null
  private var isPaused = false
  private var isNew = true

  private val onCameraReady by callback<Unit>()
  private val onMountError by callback<CameraMountErrorEvent>()
  private val onBarCodeScanned by callback<BarCodeScannedEvent>(
    /**
     * We want every distinct barcode to be reported to the JS listener.
     * If we return some static value as a coalescing key there may be two barcode events
     * containing two different barcodes waiting to be transmitted to JS
     * that would get coalesced (because both of them would have the same coalescing key).
     * So let's differentiate them with a hash of the contents (mod short's max value).
     */
    coalescingKey = { event -> (event.data.hashCode() % Short.MAX_VALUE).toShort() }
  )
  private val onFacesDetected by callback<FacesDetectedEvent>(
    /**
     * Should events about detected faces coalesce, the best strategy will be
     * to ensure that events with different faces count are always being transmitted.
     */
    coalescingKey = { event -> (event.faces.size % Short.MAX_VALUE).toShort() }
  )
  private val onFaceDetectionError by callback<FaceDetectionErrorEvent>()
  private val onPictureSaved by callback<PictureSavedEvent>(
    coalescingKey = { event ->
      val uriHash = event.data.getString("uri")?.hashCode() ?: -1
      (uriHash % Short.MAX_VALUE).toShort()
    }
  )

  // Concurrency lock for scanners to avoid flooding the runtime
  @Volatile
  var barCodeScannerTaskLock = false

  @Volatile
  var faceDetectorTaskLock = false

  // Scanning-related properties
  private var barCodeScanner: BarCodeScannerInterface? = null
  private var faceDetector: FaceDetectorInterface? = null
  private var pendingFaceDetectorSettings: Map<String, Any>? = null
  private var shouldDetectFaces = false
  private var mShouldScanBarCodes = false

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val preview = view ?: return
    setBackgroundColor(Color.BLACK)
    val width = right - left
    val height = bottom - top
    preview.layout(0, 0, width, height)
  }

  @SuppressLint("MissingSuperCall")
  override fun requestLayout() {
    // React handles this for us, so we don't need to call super.requestLayout();
  }

  override fun onViewAdded(child: View) {
    // react adds children to containers at the beginning of children list and that moves pre-react added preview to the end of that list
    // above would cause preview (TextureView that covers all available space) to be rendered at the top of children stack
    // while we need this preview to be rendered last beneath all other children

    // child is not preview
    if (this.view === child || this.view == null) {
      return
    }

    // bring to front all non-preview children
    val childrenToBeReordered = mutableListOf<View>()
    for (i in 0 until this.childCount) {
      val childView = getChildAt(i)
      if (i == 0 && childView === this.view) {
        // preview is already first in children list - do not reorder anything
        return
      }
      if (childView !== this.view) {
        childrenToBeReordered.add(childView)
      }
    }
    for (childView in childrenToBeReordered) {
      bringChildToFront(childView)
    }
    requestLayout()
    invalidate()
  }

  fun takePicture(options: PictureOptions, promise: Promise, cacheDirectory: File) {
    pictureTakenPromises.add(promise)
    pictureTakenOptions[promise] = options
    pictureTakenDirectories[promise] = cacheDirectory
    try {
      super.takePicture()
    } catch (e: Exception) {
      pictureTakenPromises.remove(promise)
      pictureTakenOptions.remove(promise)
      pictureTakenDirectories.remove(promise)
      throw e
    }
  }

  override fun onPictureSaved(response: Bundle) {
    onPictureSaved(PictureSavedEvent(response.getInt("id"), response.getBundle("data")!!))
  }

  fun record(options: RecordingOptions, promise: Promise, cacheDirectory: File) {
    try {
      val path = FileSystemUtils.generateOutputPath(cacheDirectory, "Camera", ".mp4")
      val profile = getCamcorderProfile(cameraId, options.quality)
      options.videoBitrate?.let { profile.videoBitRate = it }
      if (super.record(path, options.maxDuration * 1000, options.maxFileSize, !options.muteValue, profile)) {
        videoRecordedPromise = promise
      } else {
        promise.reject("E_RECORDING_FAILED", "Starting video recording failed. Another recording might be in progress.", null)
      }
    } catch (e: IOException) {
      promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.", null)
    }
  }

  /**
   * Initialize the barcode scanner.
   * Supports all iOS codes except [code138, code39mod43, itf14]
   * Additionally supports [codabar, code128, maxicode, rss14, rssexpanded, upc_a, upc_ean]
   */
  private fun initBarCodeScanner() {
    val barCodeScannerProvider = appContext.get()?.legacyModule<BarCodeScannerProviderInterface>()
    barCodeScanner = barCodeScannerProvider?.createBarCodeDetectorWithContext(context)
  }

  fun setShouldScanBarCodes(shouldScanBarCodes: Boolean) {
    mShouldScanBarCodes = shouldScanBarCodes
    scanning = mShouldScanBarCodes || shouldDetectFaces
  }

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings) {
    barCodeScanner?.setSettings(settings)
  }

  override fun onBarCodeScanned(barCode: BarCodeScannerResult) {
    if (mShouldScanBarCodes) {
      onBarCodeScanned(
        BarCodeScannedEvent(
          target = id,
          data = barCode.value,
          type = barCode.type
        )
      )
    }
  }

  override fun onBarCodeScanningTaskCompleted() {
    barCodeScannerTaskLock = false
  }

  override fun getPreviewSizeAsArray() = intArrayOf(previewSize.width, previewSize.height)

  override fun onHostResume() {
    if (hasCameraPermissions()) {
      if (isPaused && !isCameraOpened || isNew) {
        isPaused = false
        isNew = false
        if (!EmulatorUtilities.isRunningOnEmulator()) {
          start()
          val faceDetectorProvider = appContext.get()?.legacyModule<FaceDetectorProviderInterface>()
          faceDetector = faceDetectorProvider?.createFaceDetectorWithContext(context)
          pendingFaceDetectorSettings?.let {
            faceDetector?.setSettings(it)
            pendingFaceDetectorSettings = null
          }
        }
      }
    } else {
      onMountError(CameraMountErrorEvent("Camera permissions not granted - component could not be rendered."))
    }
  }

  override fun onHostPause() {
    if (!isPaused && isCameraOpened) {
      faceDetector?.release()
      isPaused = true
      stop()
    }
  }

  override fun onHostDestroy() {
    faceDetector?.release()
    stop()
  }

  private fun hasCameraPermissions(): Boolean {
    val permissionsManager = appContext.get()?.permissions ?: return false
    return permissionsManager.hasGrantedPermissions(Manifest.permission.CAMERA)
  }

  fun setShouldDetectFaces(shouldDetectFaces: Boolean) {
    this.shouldDetectFaces = shouldDetectFaces
    scanning = mShouldScanBarCodes || shouldDetectFaces
  }

  fun setFaceDetectorSettings(settings: Map<String, Any>?) {
    faceDetector?.setSettings(settings) ?: run {
      pendingFaceDetectorSettings = settings
    }
  }

  override fun onFacesDetected(faces: List<Bundle>) {
    if (shouldDetectFaces) {
      onFacesDetected(
        FacesDetectedEvent(
          "face",
          faces,
          id
        )
      )
    }
  }

  override fun onFaceDetectionError(faceDetector: FaceDetectorInterface) {
    faceDetectorTaskLock = false
    if (shouldDetectFaces) {
      onFaceDetectionError(FaceDetectionErrorEvent(true))
    }
  }

  override fun onFaceDetectingTaskCompleted() {
    faceDetectorTaskLock = false
  }

  init {
    initBarCodeScanner()
    isChildrenDrawingOrderEnabled = true
    val uIManager = appContext.get()?.legacyModule<UIManager>()
    uIManager!!.registerLifecycleEventListener(this)
    addCallback(object : Callback() {
      override fun onCameraOpened(cameraView: CameraView) {
        onCameraReady(Unit)
      }

      override fun onMountError(cameraView: CameraView) {
        onMountError(
          CameraMountErrorEvent("Camera component could not be rendered - is there any other instance running?")
        )
      }

      override fun onPictureTaken(cameraView: CameraView, data: ByteArray) {
        val promise = pictureTakenPromises.poll() ?: return
        val cacheDirectory = pictureTakenDirectories.remove(promise)
        val options = pictureTakenOptions.remove(promise)!!
        if (options.fastMode) {
          promise.resolve(null)
        }
        cacheDirectory?.let {
          ResolveTakenPictureAsyncTask(data, promise, options, it, this@ExpoCameraView).execute()
        }
      }

      override fun onVideoRecorded(cameraView: CameraView, path: String) {
        videoRecordedPromise?.let {
          it.resolve(
            Bundle().apply {
              putString("uri", Uri.fromFile(File(path)).toString())
            }
          )
          videoRecordedPromise = null
        }
      }

      override fun onFramePreview(cameraView: CameraView, data: ByteArray, width: Int, height: Int, rotation: Int) {
        val correctRotation = getCorrectCameraRotation(rotation, facing)
        if (mShouldScanBarCodes && !barCodeScannerTaskLock && cameraView is BarCodeScannerAsyncTaskDelegate) {
          barCodeScannerTaskLock = true
          val delegate = cameraView as BarCodeScannerAsyncTaskDelegate
          barCodeScanner?.let { BarCodeScannerAsyncTask(delegate, it, data, width, height, rotation).execute() }
        }
        if (shouldDetectFaces && !faceDetectorTaskLock && cameraView is FaceDetectorAsyncTaskDelegate) {
          faceDetectorTaskLock = true
          val density = cameraView.resources.displayMetrics.density
          val dimensions = ImageDimensions(width, height, correctRotation, facing)
          val scaleX = cameraView.width.toDouble() / (dimensions.width * density)
          val scaleY = cameraView.height.toDouble() / (dimensions.height * density)
          val delegate = cameraView as FaceDetectorAsyncTaskDelegate
          val task = faceDetector?.let { FaceDetectorTask(delegate, it, data, width, height, correctRotation, facing == FACING_FRONT, scaleX, scaleY) }
          task?.execute()
        }
      }
    })
  }
}
