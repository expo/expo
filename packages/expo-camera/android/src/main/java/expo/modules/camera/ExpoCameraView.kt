package expo.modules.camera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.Manifest
import android.media.CamcorderProfile
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View

import com.google.android.cameraview.CameraView

import expo.modules.camera.CameraViewHelper.emitCameraReadyEvent
import expo.modules.camera.CameraViewHelper.emitMountErrorEvent
import expo.modules.camera.CameraViewHelper.getCorrectCameraRotation
import expo.modules.camera.CameraViewHelper.emitPictureSavedEvent
import expo.modules.camera.CameraViewHelper.getCamcorderProfile
import expo.modules.camera.CameraViewHelper.emitBarCodeReadEvent
import expo.modules.camera.CameraViewHelper.emitFacesDetectedEvent
import expo.modules.camera.CameraViewHelper.emitFaceDetectionErrorEvent
import expo.modules.camera.tasks.BarCodeScannerAsyncTaskDelegate
import expo.modules.camera.tasks.FaceDetectorAsyncTaskDelegate
import expo.modules.camera.tasks.PictureSavedDelegate
import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask
import expo.modules.camera.tasks.BarCodeScannerAsyncTask
import expo.modules.camera.tasks.FaceDetectorTask
import expo.modules.camera.utils.FileSystemUtils
import expo.modules.camera.utils.ImageDimensions
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.facedetector.FaceDetectorInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.facedetector.FaceDetectorProviderInterface
import expo.modules.interfaces.permissions.Permissions

import java.io.File
import java.io.IOException
import java.lang.Exception
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedQueue

private const val MUTE_KEY = "mute"
private const val QUALITY_KEY = "quality"
private const val FAST_MODE_KEY = "fastMode"
private const val MAX_DURATION_KEY = "maxDuration"
private const val MAX_FILE_SIZE_KEY = "maxFileSize"
private const val VIDEO_BITRATE_KEY = "videoBitrate"

class ExpoCameraView(
  themedReactContext: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : CameraView(themedReactContext, true),
  LifecycleEventListener,
  BarCodeScannerAsyncTaskDelegate,
  FaceDetectorAsyncTaskDelegate,
  PictureSavedDelegate,
  CameraViewInterface {

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()
  private val pictureTakenPromises: Queue<Promise> = ConcurrentLinkedQueue()
  private val pictureTakenOptions: MutableMap<Promise, Map<String, Any>> = ConcurrentHashMap()
  private val pictureTakenDirectories: MutableMap<Promise, File> = ConcurrentHashMap()
  private var videoRecordedPromise: Promise? = null
  private var isPaused = false
  private var isNew = true
  private val eventEmitter: EventEmitter by moduleRegistry()

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

  fun takePicture(options: Map<String, Any>, promise: Promise, cacheDirectory: File) {
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
    emitPictureSavedEvent(eventEmitter, this, response)
  }

  fun record(options: Map<String?, Any?>, promise: Promise, cacheDirectory: File) {
    try {
      val path = FileSystemUtils.generateOutputPath(cacheDirectory, "Camera", ".mp4")
      val maxDuration = options[MAX_DURATION_KEY]?.let { it as Double } ?: -1.0
      val maxFileSize = options[MAX_FILE_SIZE_KEY]?.let { it as Double } ?: -1.0
      val profile = if (options[QUALITY_KEY] != null) {
        getCamcorderProfile(cameraId, (options[QUALITY_KEY] as Double).toInt())
      } else {
        CamcorderProfile.get(cameraId, CamcorderProfile.QUALITY_HIGH)
      }
      options[VIDEO_BITRATE_KEY]?.let { profile.videoBitRate = (it as Double).toInt() }
      val muteValue = options[MUTE_KEY] as Boolean?
      val recordAudio = muteValue != true
      if (super.record(path, maxDuration.toInt() * 1000, maxFileSize.toInt(), recordAudio, profile)) {
        videoRecordedPromise = promise
      } else {
        promise.reject("E_RECORDING_FAILED", "Starting video recording failed. Another recording might be in progress.")
      }
    } catch (e: IOException) {
      promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.")
    }
  }

  /**
   * Initialize the barcode scanner.
   * Supports all iOS codes except [code138, code39mod43, itf14]
   * Additionally supports [codabar, code128, maxicode, rss14, rssexpanded, upc_a, upc_ean]
   */
  private fun initBarCodeScanner() {
    val barCodeScannerProvider: BarCodeScannerProviderInterface? by moduleRegistry()
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
      emitBarCodeReadEvent(eventEmitter, this, barCode)
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
        if (!Build.FINGERPRINT.contains("generic")) {
          start()
          val faceDetectorProvider: FaceDetectorProviderInterface? by moduleRegistry()
          faceDetector = faceDetectorProvider?.createFaceDetectorWithContext(context)
          pendingFaceDetectorSettings.let {
            faceDetector?.setSettings(it)
            pendingFaceDetectorSettings = null
          }
        }
      }
    } else {
      emitMountErrorEvent(eventEmitter, this, "Camera permissions not granted - component could not be rendered.")
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
    val permissionsManager: Permissions by moduleRegistry()
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
      emitFacesDetectedEvent(eventEmitter, this, faces)
    }
  }

  override fun onFaceDetectionError(faceDetector: FaceDetectorInterface) {
    faceDetectorTaskLock = false
    if (shouldDetectFaces) {
      emitFaceDetectionErrorEvent(eventEmitter, this, faceDetector)
    }
  }

  override fun onFaceDetectingTaskCompleted() {
    faceDetectorTaskLock = false
  }

  init {
    initBarCodeScanner()
    isChildrenDrawingOrderEnabled = true
    val uIManager: UIManager by moduleRegistry()
    uIManager.registerLifecycleEventListener(this)
    addCallback(object : Callback() {
      override fun onCameraOpened(cameraView: CameraView) {
        emitCameraReadyEvent(eventEmitter, cameraView)
      }

      override fun onMountError(cameraView: CameraView) {
        emitMountErrorEvent(eventEmitter, cameraView, "Camera component could not be rendered - is there any other instance running?")
      }

      override fun onPictureTaken(cameraView: CameraView, data: ByteArray) {
        val promise = pictureTakenPromises.poll()
        val cacheDirectory = pictureTakenDirectories.remove(promise)
        val options = pictureTakenOptions.remove(promise) as MutableMap
        if (options.containsKey(FAST_MODE_KEY) && options[FAST_MODE_KEY] as Boolean) {
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
