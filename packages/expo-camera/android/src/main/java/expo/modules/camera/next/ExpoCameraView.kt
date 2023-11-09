package expo.modules.camera.next

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraMetadata
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.Camera
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraState
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.MirrorMode
import androidx.camera.core.Preview
import androidx.camera.core.UseCaseGroup
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import expo.modules.camera.BarCodeScannedEvent
import expo.modules.camera.CameraMountErrorEvent
import expo.modules.camera.PictureSavedEvent
import expo.modules.camera.next.analyzers.BarcodeAnalyzer
import expo.modules.camera.next.analyzers.toByteArray
import expo.modules.camera.next.records.BarCodeSettings
import expo.modules.camera.next.records.BarcodeType
import expo.modules.camera.next.records.CameraMode
import expo.modules.camera.next.records.CameraType
import expo.modules.camera.next.records.FlashMode
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
  appContext: AppContext,
) : ExpoView(context, appContext),
  CameraViewInterface {
  private val currentActivity
    get() = appContext.currentActivity as? AppCompatActivity
      ?: throw Exceptions.MissingActivity()

  var camera: Camera? = null
  var activeRecording: Recording? = null

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

  var mute: Boolean = false

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

  private val onPictureSaved by EventDispatcher<PictureSavedEvent>(
    coalescingKey = { event ->
      val uriHash = event.data.getString("uri")?.hashCode() ?: -1
      (uriHash % Short.MAX_VALUE).toShort()
    }
  )

  // Scanning-related properties
  private var shouldScanBarCodes = false

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val width = right - left
    val height = bottom - top

    previewView.layout(0, 0, width, height)
    previewView.setBackgroundColor(Color.BLACK)
    if (changed) {
      createCamera()
    }
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
    camera?.cameraControl?.enableTorch(enabled)
  }

  fun record(options: RecordingOptions, promise: Promise, cacheDirectory: File) {
    val file = FileSystemUtils.generateOutputFile(cacheDirectory, "Camera", ".mp4")
    val fileOutputOptions = FileOutputOptions.Builder(file)
      .setFileSizeLimit(options.maxFileSize.toLong())
      .setDurationLimitMillis(options.maxDuration.toLong())
      .build()

    recorder?.let {
      activeRecording = it.prepareRecording(context, fileOutputOptions)
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
    val providerFuture = ProcessCameraProvider.getInstance(context)

    providerFuture.addListener(
      {
        val cameraProvider: ProcessCameraProvider = providerFuture.get()

        val preview = Preview.Builder()
          .build()
          .also {
            it.setSurfaceProvider(previewView.surfaceProvider)
          }

        val cameraSelector = lenFacing.mapToSelector()

        imageCaptureUseCase = ImageCapture.Builder()
          .build()

        val cameraInfo = cameraProvider.availableCameraInfos.filter {
          Camera2CameraInfo
            .from(it)
            .getCameraCharacteristic(CameraCharacteristics.LENS_FACING) == CameraMetadata.LENS_FACING_BACK
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
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .setResolutionSelector(
        ResolutionSelector.Builder()
          .setAspectRatioStrategy(AspectRatioStrategy.RATIO_16_9_FALLBACK_AUTO_STRATEGY)
          .build()
      )
      .build()
      .also { analyzer ->
        if (shouldScanBarCodes) {
          analyzer.setAnalyzer(
            ContextCompat.getMainExecutor(context),
            BarcodeAnalyzer(lenFacing, barcodeFormats) {
              onBarCodeScanned(it)
            }
          )
        }
      }

  private fun createVideoCapture(info: List<CameraInfo>): VideoCapture<Recorder> {
    val supportedQualities = QualitySelector.getSupportedQualities(info[0])

    val filteredQualities = arrayListOf(Quality.UHD, Quality.FHD, Quality.HD, Quality.SD)
      .filter { supportedQualities.contains(it) }
    val qualitySelector = QualitySelector.fromOrderedList(filteredQualities)

    val recorder = Recorder.Builder()
      .setExecutor(ContextCompat.getMainExecutor(context))
      .setQualitySelector(qualitySelector)
      .build()
      .also {
        this.recorder = it
      }

    return VideoCapture.Builder(recorder)
      .setMirrorMode(MirrorMode.MIRROR_MODE_ON_FRONT_ONLY)
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

  fun setShouldScanBarCodes(shouldScanBarCodes: Boolean) {
    this.shouldScanBarCodes = shouldScanBarCodes
    createCamera()
  }

  fun setBarCodeScannerSettings(settings: BarCodeSettings?) {
    barcodeFormats = settings?.barcodeTypes ?: emptyList()
    createCamera()
  }

  private fun getDeviceOrientation() =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation

  private fun transformBarCodeScannerResultToViewCoordinates(barCode: BarCodeScannerResult) {
    val cornerPoints = barCode.cornerPoints

    val cameraWidth = barCode.referenceImageHeight
    val cameraHeight = barCode.referenceImageWidth
    val previewWidth = previewView.width
    val previewHeight = previewView.height

    val facingFront = lenFacing == CameraType.FRONT
    val portrait = getDeviceOrientation() % 2 == 0
    val landscape = getDeviceOrientation() % 2 != 0

    if (facingFront && portrait) {
      cornerPoints.mapY { barCode.referenceImageHeight - cornerPoints[it] }
    }
    if (facingFront && landscape) {
      cornerPoints.mapX { barCode.referenceImageWidth - cornerPoints[it] }
    }

    val scaleX = if (portrait) {
      previewWidth / cameraHeight.toFloat()
    } else {
      previewWidth / cameraWidth.toFloat()
    }
    val scaleY = if (portrait) {
      previewHeight / cameraWidth.toFloat()
    } else {
      previewHeight / cameraHeight.toFloat()
    }

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

  private fun onBarCodeScanned(barCode: BarCodeScannerResult) {
    if (shouldScanBarCodes) {
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

  override fun setPreviewTexture(surfaceTexture: SurfaceTexture?) = Unit

  override fun getPreviewSizeAsArray() = intArrayOf(previewView.width, previewView.height)

  init {
    isChildrenDrawingOrderEnabled = true
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
    createCamera()
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
