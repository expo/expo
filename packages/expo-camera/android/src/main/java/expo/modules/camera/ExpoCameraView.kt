package expo.modules.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.graphics.drawable.ColorDrawable
import android.hardware.camera2.CameraCharacteristics
import android.media.MediaActionSound
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.util.Size
import android.view.OrientationEventListener
import android.view.Surface
import android.view.View
import android.view.WindowManager
import androidx.annotation.OptIn
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.Camera
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.DisplayOrientedMeteringPointFactory
import androidx.camera.core.FocusMeteringAction
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.UseCaseGroup
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FallbackStrategy
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import expo.modules.camera.common.BarcodeScannedEvent
import expo.modules.camera.common.CameraMountErrorEvent
import expo.modules.camera.common.PictureSavedEvent
import expo.modules.camera.analyzers.BarcodeAnalyzer
import expo.modules.camera.analyzers.toByteArray
import expo.modules.camera.records.BarcodeSettings
import expo.modules.camera.records.BarcodeType
import expo.modules.camera.records.CameraMode
import expo.modules.camera.records.CameraType
import expo.modules.camera.records.FlashMode
import expo.modules.camera.records.FocusMode
import expo.modules.camera.records.VideoQuality
import expo.modules.camera.tasks.ResolveTakenPicture
import expo.modules.camera.utils.FileSystemUtils
import expo.modules.camera.utils.mapX
import expo.modules.camera.utils.mapY
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult.BoundingBox
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.File
import kotlin.math.roundToInt

const val ANIMATION_FAST_MILLIS = 50L
const val ANIMATION_SLOW_MILLIS = 100L

@SuppressLint("ViewConstructor")
class ExpoCameraView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext),
  CameraViewInterface {
  private val currentActivity
    get() = appContext.currentActivity as? AppCompatActivity
      ?: throw Exceptions.MissingActivity()

  val orientationEventListener by lazy {
    object : OrientationEventListener(currentActivity) {
      override fun onOrientationChanged(orientation: Int) {
        if (orientation == ORIENTATION_UNKNOWN) {
          return
        }

        val rotation = when (orientation) {
          in 45 until 135 -> Surface.ROTATION_270
          in 135 until 225 -> Surface.ROTATION_180
          in 225 until 315 -> Surface.ROTATION_90
          else -> Surface.ROTATION_0
        }

        imageAnalysisUseCase?.targetRotation = rotation
        imageCaptureUseCase?.targetRotation = rotation
      }
    }
  }

  var camera: Camera? = null
  var activeRecording: Recording? = null

  private var cameraProvider: ProcessCameraProvider? = null
  private val providerFuture = ProcessCameraProvider.getInstance(context)
  private var imageCaptureUseCase: ImageCapture? = null
  private var imageAnalysisUseCase: ImageAnalysis? = null
  private var recorder: Recorder? = null
  private var barcodeFormats: List<BarcodeType> = emptyList()

  private var previewView = PreviewView(context)
  private val scope = CoroutineScope(Dispatchers.Main)
  private var shouldCreateCamera = false

  var lenFacing = CameraType.BACK
    set(value) {
      field = value
      shouldCreateCamera = true
    }

  var cameraMode: CameraMode = CameraMode.PICTURE
    set(value) {
      field = value
      shouldCreateCamera = true
    }

  var autoFocus: FocusMode = FocusMode.OFF
    set(value) {
      field = value
      camera?.cameraControl?.let {
        if (field == FocusMode.OFF) {
          it.cancelFocusAndMetering()
        } else {
          startFocusMetering()
        }
      }
    }

  var videoQuality: VideoQuality = VideoQuality.VIDEO1080P
    set(value) {
      field = value
      shouldCreateCamera = true
    }

  var pictureSize: String = ""
    set(value) {
      field = value
      shouldCreateCamera = true
    }

  var mute: Boolean = false
  var animateShutter: Boolean = true

  private val onCameraReady by EventDispatcher<Unit>()
  private val onMountError by EventDispatcher<CameraMountErrorEvent>()
  private val onBarcodeScanned by EventDispatcher<BarcodeScannedEvent>(
    /**
     * We want every distinct barcode to be reported to the JS listener.
     * If we return some static value as a coalescing key there may be two barcode events
     * containing two different barcodes waiting to be transmitted to JS
     * that would get coalesced (because both of them would have the same coalescing key).
     * So let's differentiate them with a hash of the contents (mod short's max value).
     */
    coalescingKey = { event -> (event.data.hashCode() % Short.MAX_VALUE).toShort() }
  )

  private val onPictureSaved by EventDispatcher<PictureSavedEvent>(
    coalescingKey = { event ->
      val uriHash = event.data.getString("uri")?.hashCode() ?: -1
      (uriHash % Short.MAX_VALUE).toShort()
    }
  )

  // Scanning-related properties
  private var shouldScanBarcodes = false

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val width = right - left
    val height = bottom - top

    previewView.layout(0, 0, width, height)
    postInvalidate(left, top, right, bottom)
  }

  override fun onViewAdded(child: View) {
    if (previewView === child) {
      return
    }
    removeView(previewView)
    addView(previewView, 0)
  }

  fun takePicture(options: PictureOptions, promise: Promise, cacheDirectory: File) {
    imageCaptureUseCase?.takePicture(
      ContextCompat.getMainExecutor(context),
      object : ImageCapture.OnImageCapturedCallback() {
        override fun onCaptureStarted() {
          MediaActionSound().play(MediaActionSound.SHUTTER_CLICK)
          if (!animateShutter) {
            return
          }
          rootView.postDelayed({
            rootView.foreground = ColorDrawable(Color.WHITE)
            rootView.postDelayed(
              { rootView.foreground = null },
              ANIMATION_FAST_MILLIS
            )
          }, ANIMATION_SLOW_MILLIS)
        }

        override fun onCaptureSuccess(image: ImageProxy) {
          val data = image.planes.toByteArray()

          if (options.fastMode) {
            promise.resolve(null)
          }
          cacheDirectory.let {
            scope.launch {
              ResolveTakenPicture(data, promise, options, it) { response: Bundle ->
                onPictureSaved(response)
              }.resolve()
            }
          }
          image.close()
        }

        override fun onError(exception: ImageCaptureException) {
          promise.reject(CameraExceptions.ImageCaptureFailed())
        }
      }
    )
  }

  fun setCameraFlashMode(mode: FlashMode) {
    if (imageCaptureUseCase?.flashMode != mode.mapToLens()) {
      imageCaptureUseCase?.flashMode = mode.mapToLens()
    }
  }

  fun setTorchEnabled(enabled: Boolean) {
    if (camera?.cameraInfo?.hasFlashUnit() == true) {
      camera?.cameraControl?.enableTorch(enabled)
    }
  }

  fun record(options: RecordingOptions, promise: Promise, cacheDirectory: File) {
    val file = FileSystemUtils.generateOutputFile(cacheDirectory, "Camera", ".mp4")
    val fileOutputOptions = FileOutputOptions.Builder(file)
      .setFileSizeLimit(options.maxFileSize.toLong())
      .setDurationLimitMillis(options.maxDuration.toLong() * 1000)
      .build()
    recorder?.let {
      if (!mute && ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        promise.reject(Exceptions.MissingPermissions(Manifest.permission.RECORD_AUDIO))
        return
      }
      activeRecording = it.prepareRecording(context, fileOutputOptions)
        .apply {
          if (!mute) {
            withAudioEnabled()
          }
        }
        .start(ContextCompat.getMainExecutor(context)) { event ->
          when (event) {
            is VideoRecordEvent.Finalize -> {
              when (event.error) {
                VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED,
                VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED,
                VideoRecordEvent.Finalize.ERROR_NONE -> {
                  promise.resolve(
                    Bundle().apply {
                      putString("uri", event.outputResults.outputUri.toString())
                    }
                  )
                }
                else -> promise.reject(
                  CameraExceptions.VideoRecordingFailed(
                    event.cause?.message
                      ?: "Video recording Failed: ${event.cause?.message ?: "Unknown error"}"
                  )
                )
              }
            }
          }
        }
    }
      ?: promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.", null)
  }

  @SuppressLint("UnsafeOptInUsageError")
  fun createCamera() {
    if (!shouldCreateCamera) {
      return
    }
    shouldCreateCamera = false
    providerFuture.addListener(
      {
        val cameraProvider: ProcessCameraProvider = providerFuture.get()

        val preview = Preview.Builder()
          .build()
          .also {
            it.setSurfaceProvider(previewView.surfaceProvider)
          }

        val cameraSelector = CameraSelector.Builder()
          .requireLensFacing(lenFacing.mapToCharacteristic())
          .build()

        imageCaptureUseCase = ImageCapture.Builder()
          .apply {
            if (pictureSize.isNotEmpty()) {
              val size = Size.parseSize(pictureSize)
              setTargetResolution(size)
            } else {
              setResolutionSelector(
                ResolutionSelector.Builder()
                  .setResolutionStrategy(ResolutionStrategy.HIGHEST_AVAILABLE_STRATEGY)
                  .build()
              )
            }
          }
          .build()

        val videoCapture = createVideoCapture()
        imageAnalysisUseCase = createImageAnalyzer()

        val useCases = UseCaseGroup.Builder().apply {
          addUseCase(preview)
          if (cameraMode == CameraMode.PICTURE) {
            imageCaptureUseCase?.let {
              addUseCase(it)
            }
            imageAnalysisUseCase?.let {
              addUseCase(it)
            }
          } else {
            addUseCase(videoCapture)
          }
        }.build()

        try {
          cameraProvider.unbindAll()
          camera = cameraProvider.bindToLifecycle(currentActivity, cameraSelector, useCases)
          camera?.let {
            observeCameraState(it.cameraInfo)
          }
          this.cameraProvider = cameraProvider
        } catch (e: Exception) {
          onMountError(
            CameraMountErrorEvent("Camera component could not be rendered - is there any other instance running?")
          )
        }
      },
      ContextCompat.getMainExecutor(context)
    )
  }

  private fun createImageAnalyzer(): ImageAnalysis =
    ImageAnalysis.Builder()
      .setResolutionSelector(
        ResolutionSelector.Builder()
          .setResolutionStrategy(ResolutionStrategy.HIGHEST_AVAILABLE_STRATEGY)
          .build()
      )
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .build()
      .also { analyzer ->
        if (shouldScanBarcodes) {
          analyzer.setAnalyzer(
            ContextCompat.getMainExecutor(context),
            BarcodeAnalyzer(lenFacing, barcodeFormats) {
              onBarcodeScanned(it)
            }
          )
        }
      }

  private fun createVideoCapture(): VideoCapture<Recorder> {
    val preferredQuality = videoQuality.mapToQuality()
    val fallbackStrategy = FallbackStrategy.lowerQualityOrHigherThan(preferredQuality)
    val qualitySelector = QualitySelector.from(preferredQuality, fallbackStrategy)

    val recorder = Recorder.Builder()
      .setExecutor(ContextCompat.getMainExecutor(context))
      .setQualitySelector(qualitySelector)
      .build()
      .also {
        this.recorder = it
      }

    return VideoCapture.Builder(recorder)
      .setVideoStabilizationEnabled(true)
      .build()
  }

  private fun startFocusMetering() {
    camera?.let {
      val meteringPointFactory = DisplayOrientedMeteringPointFactory(
        previewView.display,
        it.cameraInfo,
        previewView.width.toFloat(),
        previewView.height.toFloat()
      )
      val action = FocusMeteringAction.Builder(meteringPointFactory.createPoint(1f, 1f), FocusMeteringAction.FLAG_AF)
        .build()
      it.cameraControl.startFocusAndMetering(action)
    }
  }

  private fun observeCameraState(cameraInfo: CameraInfo) {
    cameraInfo.cameraState.observe(currentActivity) {
      when (it.type) {
        CameraState.Type.OPEN -> {
          onCameraReady(Unit)
        }
        else -> {}
      }
    }
  }

  @OptIn(ExperimentalCamera2Interop::class)
  fun getAvailablePictureSizes(): List<String> {
    return camera?.cameraInfo?.let { cameraInfo ->
      val info = Camera2CameraInfo.from(cameraInfo).getCameraCharacteristic(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
      info?.getOutputSizes(ImageFormat.JPEG)?.map { it.toString() }
    } ?: emptyList()
  }

  fun setShouldScanBarcodes(shouldScanBarcodes: Boolean) {
    this.shouldScanBarcodes = shouldScanBarcodes
    shouldCreateCamera = true
  }

  fun setBarcodeScannerSettings(settings: BarcodeSettings?) {
    barcodeFormats = settings?.barcodeTypes ?: emptyList()
  }

  private fun getDeviceOrientation() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    appContext.currentActivity?.display?.rotation ?: 0
  } else {
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation
  }

  fun releaseCamera() {
    appContext.mainQueue.launch {
      cameraProvider?.unbindAll()
    }
  }

  private fun transformBarcodeScannerResultToViewCoordinates(barcode: BarCodeScannerResult) {
    val cornerPoints = barcode.cornerPoints
    val previewWidth = previewView.width
    val previewHeight = previewView.height

    val facingFront = lenFacing == CameraType.FRONT
    val portrait = getDeviceOrientation() % 2 == 0
    val landscape = getDeviceOrientation() % 2 != 0

    if (facingFront && portrait) {
      cornerPoints.mapY { barcode.referenceImageHeight - cornerPoints[it] }
    }
    if (facingFront && landscape) {
      cornerPoints.mapX { barcode.referenceImageWidth - cornerPoints[it] }
    }

    cornerPoints.mapX {
      (cornerPoints[it] * previewWidth / barcode.referenceImageWidth.toFloat())
        .roundToInt()
    }
    cornerPoints.mapY {
      (cornerPoints[it] * previewHeight / barcode.referenceImageHeight.toFloat())
        .roundToInt()
    }

    barcode.cornerPoints = cornerPoints
    barcode.referenceImageHeight = height
    barcode.referenceImageWidth = width
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

  private fun onBarcodeScanned(barcode: BarCodeScannerResult) {
    if (shouldScanBarcodes) {
      transformBarcodeScannerResultToViewCoordinates(barcode)
      val (cornerPoints, boundingBox) = getCornerPointsAndBoundingBox(barcode.cornerPoints, barcode.boundingBox)
      onBarcodeScanned(
        BarcodeScannedEvent(
          target = id,
          data = barcode.value,
          raw = barcode.raw,
          type = barcode.type,
          cornerPoints = cornerPoints,
          boundingBox = boundingBox
        )
      )
    }
  }

  override fun setPreviewTexture(surfaceTexture: SurfaceTexture?) = Unit

  override fun getPreviewSizeAsArray() = intArrayOf(previewView.width, previewView.height)

  init {
    orientationEventListener.enable()
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
  }

  fun onPictureSaved(response: Bundle) {
    onPictureSaved(PictureSavedEvent(response.getInt("id"), response.getBundle("data")!!))
  }

  fun cancelCoroutineScope() {
    try {
      scope.cancel(ModuleDestroyedException())
    } catch (e: Exception) {
      Log.e(CameraViewModule.TAG, "The scope does not have a job in it")
    }
  }
}
