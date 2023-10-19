package expo.modules.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.SurfaceTexture
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.AspectRatio
import androidx.camera.core.Camera
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraState
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoOutput
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import expo.modules.camera.CameraViewHelper.getCorrectCameraRotation
import expo.modules.camera.analyzers.CameraAnalyzer
import expo.modules.camera.analyzers.toByteArray
import expo.modules.camera.records.CameraType
import expo.modules.camera.records.FlashMode
import expo.modules.camera.tasks.BarCodeScannerAsyncTask
import expo.modules.camera.tasks.BarCodeScannerAsyncTaskDelegate
import expo.modules.camera.tasks.FaceDetectorAsyncTaskDelegate
import expo.modules.camera.tasks.FaceDetectorTask
import expo.modules.camera.tasks.PictureSavedDelegate
import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask
import expo.modules.camera.utils.ImageDimensions
import expo.modules.camera.utils.mapX
import expo.modules.camera.utils.mapY
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult.BoundingBox
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.interfaces.facedetector.FaceDetectorInterface
import expo.modules.interfaces.facedetector.FaceDetectorProviderInterface
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.io.IOException
import java.util.*
import kotlin.math.roundToInt


@SuppressLint("ViewConstructor")
class ExpoCameraView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext),
  LifecycleEventListener,
  BarCodeScannerAsyncTaskDelegate,
  FaceDetectorAsyncTaskDelegate,
  PictureSavedDelegate,
  CameraViewInterface {
  private val currentActivity
    get() = appContext.currentActivity as? AppCompatActivity
      ?: throw Exceptions.MissingActivity()

  var camera: Camera? = null
  private var imageCaptureUseCase: ImageCapture? = null
  private var videoCaptureUseCase: VideoCapture<VideoOutput>? = null
  private var imageAnalysisUseCase: ImageAnalysis? = null

  var previewView = PreviewView(context)

  private var videoRecordedPromise: Promise? = null
  private var isPaused = false
  private var isNew = true

  var cameraSelectorFacing = CameraType.BACK
    set(value) {
      field = value
      startCamera()
    }

  var torchEnabled: Boolean = false
    set(value) {
      field = value
      camera?.cameraControl?.enableTorch(value)
    }

  var flashMode: FlashMode = FlashMode.OFF
    set(value) {
      field = value
      imageCaptureUseCase?.flashMode = value.mapToLens()
    }

  private val onCameraReady by EventDispatcher<Unit>()
  private val onMountError by EventDispatcher<CameraMountErrorEvent>()
  private val onBarCodeScanned by EventDispatcher<BarCodeScannedEvent>(
    /**
     * We want every distinct barcode to be reported to the JS listener.
     * If we return some static value as a coalescing key there may be two barcode events
     * containing two different barcodes waiting to be transmitted to JS
     * that would get coalesced (because both of them would have the same coalescing key).
     * So let's differentiate them with a hash of the contents (mod short's max value).
     */
    coalescingKey = { event -> (event.data.hashCode() % Short.MAX_VALUE).toShort() }
  )
  private val onFacesDetected by EventDispatcher<FacesDetectedEvent>(
    /**
     * Should events about detected faces coalesce, the best strategy will be
     * to ensure that events with different faces count are always being transmitted.
     */
    coalescingKey = { event -> (event.faces.size % Short.MAX_VALUE).toShort() }
  )
  private val onFaceDetectionError by EventDispatcher<FaceDetectionErrorEvent>()
  private val onPictureSaved by EventDispatcher<PictureSavedEvent>(
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
    val width = right - left
    val height = bottom - top

    previewView.layout(0, 0, width, height)
    previewView.setBackgroundColor(Color.BLACK)
  }

  override fun onViewAdded(child: View) {
    // react adds children to containers at the beginning of children list and that moves pre-react added preview to the end of that list
    // above would cause preview (TextureView that covers all available space) to be rendered at the top of children stack
    // while we need this preview to be rendered last beneath all other children

    // child is not preview
    if (previewView === child) {
      return
    }

    // bring to front all non-preview children
    val childrenToBeReordered = mutableListOf<View>()
    for (i in 0 until this.childCount) {
      val childView = getChildAt(i)
      if (i == 0 && childView === previewView) {
        // preview is already first in children list - do not reorder anything
        return
      }
      if (childView !== previewView) {
        childrenToBeReordered.add(childView)
      }
    }
    for (childView in childrenToBeReordered) {
      bringChildToFront(childView)
    }
    previewView.requestLayout()
    previewView.invalidate()
  }

  fun takePicture(options: PictureOptions, promise: Promise, cacheDirectory: File) {
    imageCaptureUseCase?.takePicture(
      ContextCompat.getMainExecutor(context),
      object : ImageCapture.OnImageCapturedCallback() {
        override fun onCaptureSuccess(image: ImageProxy) {
          val data = image.planes.toByteArray()

          if (options.fastMode) {
            promise.resolve(null)
          }
          cacheDirectory.let {
            ResolveTakenPictureAsyncTask(data, promise, options, it, this@ExpoCameraView).execute()
          }
          image.close()
        }

        override fun onError(exception: ImageCaptureException) {
          promise.reject(CameraExceptions.ImageCaptureFailed())
        }
      }
    )
  }

  @Throws(IOException::class)
  private fun readBytes(context: Context, uri: Uri): ByteArray? =
    context.contentResolver.openInputStream(uri)?.use { it.buffered().readBytes() }

  fun record(options: RecordingOptions, promise: Promise, cacheDirectory: File) {
    try {
//      val path = FileSystemUtils.generateOutputPath(cacheDirectory, "Camera", ".mp4")
//      val profile = getCamcorderProfile(cameraView.cameraId, options.quality)
//      options.videoBitrate?.let { profile.videoBitRate = it }
//      if (cameraView.record(path, options.maxDuration * 1000, options.maxFileSize, !options.mute, profile)) {
//        videoRecordedPromise = promise
//      } else {
//        promise.reject("E_RECORDING_FAILED", "Starting video recording failed. Another recording might be in progress.", null)
//      }
    } catch (e: IOException) {
      promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.", null)
    }
  }

  private fun startCamera() {
    val providerFuture = ProcessCameraProvider.getInstance(context)

    providerFuture.addListener({
      val cameraProvider: ProcessCameraProvider = providerFuture.get()

      val preview = Preview.Builder()
        .build()
        .also {
          it.setSurfaceProvider(previewView.surfaceProvider)
        }

      val cameraSelector = cameraSelectorFacing.mapToSelector()

      imageCaptureUseCase = ImageCapture.Builder()
        .setTargetAspectRatio(AspectRatio.RATIO_16_9)
        .build()

      imageAnalysisUseCase = createImageAnalyzer()

      try {
        cameraProvider.unbindAll()
        camera = cameraProvider.bindToLifecycle(currentActivity, cameraSelector, preview, imageCaptureUseCase, imageAnalysisUseCase)
        observeCameraState(camera!!.cameraInfo)
      } catch (e: Exception) {
        onMountError(
          CameraMountErrorEvent("Camera component could not be rendered - is there any other instance running?")
        )
      }
    }, ContextCompat.getMainExecutor(context))
  }


  private fun createImageAnalyzer(): ImageAnalysis =
    ImageAnalysis.Builder()
      .build()
      .also { image ->
        image.setAnalyzer(ContextCompat.getMainExecutor(context), CameraAnalyzer { data, width, height, rotation ->
          if (mShouldScanBarCodes && !barCodeScannerTaskLock) {
            val lensFacing = cameraSelectorFacing
            val correctRotation = getCorrectCameraRotation(rotation, lensFacing.ordinal)
            barCodeScannerTaskLock = true
            barCodeScanner?.let { BarCodeScannerAsyncTask(this@ExpoCameraView, it, data, width, height, correctRotation).execute() }
          }
          if (shouldDetectFaces && !faceDetectorTaskLock) {
            faceDetectorTaskLock = true
            val density = context.resources.displayMetrics.density
            val dimensions = ImageDimensions(width, height, rotation, cameraSelectorFacing)
            val scaleX = previewView.width.toDouble() / (dimensions.width * density)
            val scaleY = previewView.height.toDouble() / (dimensions.height * density)
            val task = faceDetector?.let { FaceDetectorTask(this@ExpoCameraView, it, data, width, height, rotation, cameraSelectorFacing == CameraType.FRONT, scaleX, scaleY) }
            task?.execute()
          }
        })
      }

  private fun observeCameraState(cameraInfo: CameraInfo) {
    cameraInfo.cameraState.observe(currentActivity) {
      when (it.type) {
        CameraState.Type.OPEN -> {
          onCameraReady(Unit)
        }

        else -> {

        }
      }
    }
  }

  /**
   * Initialize the barcode scanner.
   * Supports all iOS codes except [code138, code39mod43, itf14]
   * Additionally supports [codabar, code128, maxicode, rss14, rssexpanded, upc_a, upc_ean]
   */
  private fun initBarCodeScanner() {
    val barCodeScannerProvider = appContext.legacyModule<BarCodeScannerProviderInterface>()
    barCodeScanner = barCodeScannerProvider?.createBarCodeDetectorWithContext(context)
  }

  fun setShouldScanBarCodes(shouldScanBarCodes: Boolean) {
    mShouldScanBarCodes = shouldScanBarCodes
  }

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings) {
    barCodeScanner?.setSettings(settings)
  }

  // Even = portrait, odd = landscape
  private fun getDeviceOrientation() =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation

  private fun transformBarCodeScannerResultToViewCoordinates(barCode: BarCodeScannerResult) {
    val cornerPoints = barCode.cornerPoints

    // For some reason they're swapped, I don't know anymore...
    val cameraWidth = barCode.referenceImageHeight
    val cameraHeight = barCode.referenceImageWidth

    val facingBack = cameraSelectorFacing == CameraType.FRONT
    val facingFront = cameraSelectorFacing == CameraType.BACK
    val portrait = getDeviceOrientation() % 2 == 0
    val landscape = getDeviceOrientation() % 2 == 1

    if (facingBack && portrait) {
      cornerPoints.mapX { cameraWidth - cornerPoints[it] }
    }
    if (facingBack && landscape) {
      cornerPoints.mapY { cameraHeight - cornerPoints[it] }
    }
    if (facingFront) {
      cornerPoints.mapX { cameraWidth - cornerPoints[it] }
      cornerPoints.mapY { cameraHeight - cornerPoints[it] }
    }

    val scaleX = width / cameraWidth.toDouble()
    val scaleY = height / cameraHeight.toDouble()

    cornerPoints.mapX {
      (cornerPoints[it] * scaleX)
        .roundToInt()
    }
    cornerPoints.mapY {
      (cornerPoints[it] * scaleY)
        .roundToInt()
    }

    barCode.cornerPoints = cornerPoints
  }

  private fun getCornerPointsAndBoundingBox(cornerPoints: List<Int>, boundingBox: BoundingBox): Pair<ArrayList<Bundle>, Bundle> {
    val density = previewView.resources.displayMetrics.density
    val convertedCornerPoints = ArrayList<Bundle>()
    for (i in cornerPoints.indices step 2) {
      val y = cornerPoints[i].toFloat() / density
      val x = cornerPoints[i + 1].toFloat() / density
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
          putFloat("x", boundingBox.x.toFloat() / density)
          putFloat("y", boundingBox.y.toFloat() / density)
        }
      )
      putParcelable(
        "size",
        Bundle().apply {
          putFloat("width", boundingBox.width.toFloat() / density)
          putFloat("height", boundingBox.height.toFloat() / density)
        }
      )
    }
    return convertedCornerPoints to boundingBoxBundle
  }

  override fun onBarCodeScanned(barCode: BarCodeScannerResult) {
    if (mShouldScanBarCodes) {
      transformBarCodeScannerResultToViewCoordinates(barCode)
      val (cornerPoints, boundingBox) = getCornerPointsAndBoundingBox(barCode.cornerPoints, barCode.boundingBox)
      onBarCodeScanned(
        BarCodeScannedEvent(
          target = id,
          data = barCode.value,
          type = barCode.type,
          cornerPoints = cornerPoints,
          boundingBox = boundingBox
        )
      )
    }
  }

  override fun onBarCodeScanningTaskCompleted() {
    barCodeScannerTaskLock = false
  }

  override fun setPreviewTexture(surfaceTexture: SurfaceTexture?) {
//    cameraView.setPreviewTexture(surfaceTexture)
  }

  override fun getPreviewSizeAsArray() = intArrayOf(previewView.width, previewView.height)

  override fun onHostResume() {
    if (hasCameraPermissions()) {
      if (isPaused || isNew) {
        isPaused = false
        isNew = false
        if (!EmulatorUtilities.isRunningOnEmulator()) {
          val faceDetectorProvider = appContext.legacyModule<FaceDetectorProviderInterface>()
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
    if (!isPaused) {
      faceDetector?.release()
      isPaused = true
    }
  }

  override fun onHostDestroy() {
    faceDetector?.release()
  }

  private fun hasCameraPermissions(): Boolean {
    val permissionsManager = appContext.permissions ?: return false
    return permissionsManager.hasGrantedPermissions(Manifest.permission.CAMERA)
  }

  fun setShouldDetectFaces(shouldDetectFaces: Boolean) {
    this.shouldDetectFaces = shouldDetectFaces
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
    val uIManager = appContext.legacyModule<UIManager>()
    uIManager!!.registerLifecycleEventListener(this)
//
//    cameraView.addCallback(object : CameraView.Callback() {
//      override fun onVideoRecorded(cameraView: CameraView, path: String) {
//        videoRecordedPromise?.let {
//          it.resolve(
//            Bundle().apply {
//              putString("uri", Uri.fromFile(File(path)).toString())
//            }
//          )
//          videoRecordedPromise = null
//        }
//      }
//
//      override fun onFramePreview(cameraView: CameraView, data: ByteArray, width: Int, height: Int, rotation: Int) {
//        val correctRotation = getCorrectCameraRotation(rotation, cameraView.facing)
//        if (mShouldScanBarCodes && !barCodeScannerTaskLock) {
//          barCodeScannerTaskLock = true
//          barCodeScanner?.let { BarCodeScannerAsyncTask(this@ExpoCameraView, it, data, width, height, rotation).execute() }
//        }
//        if (shouldDetectFaces && !faceDetectorTaskLock) {
//          faceDetectorTaskLock = true
//          val density = cameraView.resources.displayMetrics.density
//          val dimensions = ImageDimensions(width, height, correctRotation, cameraView.facing)
//          val scaleX = cameraView.width.toDouble() / (dimensions.width * density)
//          val scaleY = cameraView.height.toDouble() / (dimensions.height * density)
//          val task = faceDetector?.let { FaceDetectorTask(this@ExpoCameraView, it, data, width, height, correctRotation, cameraView.facing == CameraView.FACING_FRONT, scaleX, scaleY) }
//          task?.execute()
//        }
//      }
//    })

    previewView.setOnHierarchyChangeListener(object : OnHierarchyChangeListener {
      override fun onChildViewRemoved(parent: View?, child: View?) = Unit
      override fun onChildViewAdded(parent: View?, child: View?) {
        parent?.measure(
          MeasureSpec.makeMeasureSpec(measuredWidth, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(measuredHeight, MeasureSpec.EXACTLY)
        )
        parent?.layout(0, 0, parent.measuredWidth, parent.measuredHeight)
      }
    })
    addView(previewView)
    startCamera()
  }

  override fun onPictureSaved(response: Bundle) {
    onPictureSaved(PictureSavedEvent(response.getInt("id"), response.getBundle("data")!!))
  }
}


