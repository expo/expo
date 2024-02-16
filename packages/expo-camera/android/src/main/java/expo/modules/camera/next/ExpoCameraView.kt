package expo.modules.camera.next

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCharacteristics
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.Camera
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.core.UseCaseGroup
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
import expo.modules.camera.BarcodeScannedEvent
import expo.modules.camera.CameraMountErrorEvent
import expo.modules.camera.PictureSavedEvent
import expo.modules.camera.next.analyzers.BarcodeAnalyzer
import expo.modules.camera.next.analyzers.toByteArray
import expo.modules.camera.next.records.BarcodeSettings
import expo.modules.camera.next.records.BarcodeType
import expo.modules.camera.next.records.CameraMode
import expo.modules.camera.next.records.CameraType
import expo.modules.camera.next.records.FlashMode
import expo.modules.camera.next.records.VideoQuality
import expo.modules.camera.next.tasks.ResolveTakenPicture
import expo.modules.camera.next.utils.FileSystemUtils
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
import java.util.*
import kotlin.math.roundToInt

@SuppressLint("ViewConstructor")
class ExpoCameraView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext),
  CameraViewInterface {
  private val currentActivity
    get() = appContext.currentActivity as? AppCompatActivity
      ?: throw Exceptions.MissingActivity()

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

  var lenFacing = CameraType.BACK
    set(value) {
      field = value
      createCamera()
    }

  var cameraMode: CameraMode = CameraMode.PICTURE
    set(value) {
      field = value
      createCamera()
    }

  var videoQuality: VideoQuality = VideoQuality.VIDEO1080P
    set(value) {
      field = value
      createCamera()
    }

  var mute: Boolean = false

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
    imageCaptureUseCase?.flashMode = mode.mapToLens()
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
      .setDurationLimitMillis(options.maxDuration.toLong())
      .build()
    recorder?.let {
      if (ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        return
      }
      activeRecording = it.prepareRecording(context, fileOutputOptions)
        .withAudioEnabled()
        .start(ContextCompat.getMainExecutor(context)) { event ->
          when (event) {
            is VideoRecordEvent.Finalize -> {
              if (event.error > 0) {
                promise.reject(
                  CameraExceptions.VideoRecordingFailed(
                    event.cause?.message
                      ?: "Video recording Failed: Unknown error"
                  )
                )
                return@start
              }
              promise.resolve(
                Bundle().apply {
                  putString("uri", event.outputResults.outputUri.toString())
                }
              )
            }
          }
        }.also { recording ->
          recording.mute(mute)
        }
    }
      ?: promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.", null)
  }

  @SuppressLint("UnsafeOptInUsageError")
  private fun createCamera() {
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
          .build()

        val cameraInfo = cameraProvider.availableCameraInfos.filter {
          Camera2CameraInfo
            .from(it)
            .getCameraCharacteristic(CameraCharacteristics.LENS_FACING) == lenFacing.mapToCharacteristic()
        }

        val videoCapture = createVideoCapture(cameraInfo)
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

  private fun createVideoCapture(info: List<CameraInfo>): VideoCapture<Recorder> {
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

  fun setShouldScanBarcodes(shouldScanBarcodes: Boolean) {
    this.shouldScanBarcodes = shouldScanBarcodes
    createCamera()
  }

  fun setBarcodeScannerSettings(settings: BarcodeSettings?) {
    barcodeFormats = settings?.barcodeTypes ?: emptyList()
  }

  private fun getDeviceOrientation() =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation

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
      Log.e(CameraViewNextModule.TAG, "The scope does not have a job in it")
    }
  }
}
