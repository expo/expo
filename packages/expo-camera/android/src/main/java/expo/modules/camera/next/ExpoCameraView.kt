package expo.modules.camera.next

import android.Manifest
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
import androidx.annotation.OptIn
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.AspectRatio
import androidx.camera.core.Camera
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraState
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
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
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import expo.modules.camera.BarCodeScannedEvent
import expo.modules.camera.CameraMountErrorEvent
import expo.modules.camera.next.CameraViewHelper.getCorrectCameraRotation
import expo.modules.camera.PictureSavedEvent
import expo.modules.camera.next.analyzers.toByteArray
import expo.modules.camera.next.records.CameraMode
import expo.modules.camera.next.records.FlashMode
import expo.modules.camera.next.records.CameraType
import expo.modules.camera.next.tasks.PictureSavedDelegate
import expo.modules.camera.next.tasks.ResolveTakenPictureAsyncTask
import expo.modules.camera.next.utils.FileSystemUtils
import expo.modules.camera.next.utils.mapX
import expo.modules.camera.next.utils.mapY
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult.BoundingBox
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.util.*
import kotlin.math.roundToInt


@SuppressLint("ViewConstructor")
class ExpoCameraView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext),
  LifecycleEventListener,
  PictureSavedDelegate,
  CameraViewInterface {
  private val currentActivity
    get() = appContext.currentActivity as? AppCompatActivity
      ?: throw Exceptions.MissingActivity()

  var camera: Camera? = null
  var activeRecording: Recording? = null

  private var imageCaptureUseCase: ImageCapture? = null
  private var imageAnalysisUseCase: ImageAnalysis? = null
  private var recorder: Recorder? = null

  private var previewView = PreviewView(context)

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
      activeRecording = it.prepareRecording(context, fileOutputOptions).start(ContextCompat.getMainExecutor(context)) { event ->
        when (event) {
          is VideoRecordEvent.Finalize -> {
            if (event.error > 0) {
              promise.reject(CameraExceptions.VideoRecordingFailed(event.cause?.message
                ?: "Video recording Failed: Unknown error"))
              return@start
            }
            promise.resolve(Bundle().apply {
              putString("uri", event.outputResults.outputUri.toString())
            })
          }
        }
      }.also { recording ->
        recording.mute(options.mute)
      }
    }
      ?: promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.", null)
  }

  @SuppressLint("UnsafeOptInUsageError")
  private fun createCamera() {
    val providerFuture = ProcessCameraProvider.getInstance(context)

    providerFuture.addListener({
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

      val useCases = if (cameraMode == CameraMode.PICTURE) {
        listOf(imageCaptureUseCase, imageAnalysisUseCase)
      } else {
        listOf(videoCapture)
      }.toTypedArray()

      try {
        cameraProvider.unbindAll()
        camera = cameraProvider.bindToLifecycle(currentActivity, cameraSelector, preview, *useCases)
        camera?.let {
          observeCameraState(it.cameraInfo)
        }
      } catch (e: Exception) {
        onMountError(
          CameraMountErrorEvent("Camera component could not be rendered - is there any other instance running?")
        )
      }
    }, ContextCompat.getMainExecutor(context))
  }


  private fun createImageAnalyzer(): ImageAnalysis =
    ImageAnalysis.Builder()
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .build()
      .also { image ->
        if (shouldScanBarCodes) {
          image.setAnalyzer(ContextCompat.getMainExecutor(context), BarcodeAnalysis())
        }
      }

  private fun createVideoCapture(info: List<CameraInfo>): VideoCapture<Recorder> {
    val supportedQualities = QualitySelector.getSupportedQualities(info[0])

    val filteredQualities = arrayListOf(Quality.UHD, Quality.FHD, Quality.HD, Quality.SD)
      .filter { supportedQualities.contains(it) }
    val qualitySelector = QualitySelector.fromOrderedList(filteredQualities)

    val recorder = Recorder.Builder()
      .setExecutor(ContextCompat.getMainExecutor(context))
      .setAspectRatio(AspectRatio.RATIO_DEFAULT)
      .setQualitySelector(qualitySelector)
      .build()
      .also {
        this.recorder = it
      }

    return VideoCapture.withOutput(recorder)
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

  fun setBarCodeScannerSettings(settings: BarCodeScannerSettings) {

  }

  // Even = portrait, odd = landscape
  private fun getDeviceOrientation() =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.rotation

  private fun transformBarCodeScannerResultToViewCoordinates(barCode: BarCodeScannerResult) {
    val cornerPoints = barCode.cornerPoints

    // For some reason they're swapped, I don't know anymore...
    val cameraWidth = barCode.referenceImageWidth
    val cameraHeight = barCode.referenceImageHeight
    val previewWidth = previewView.width
    val previewHeight = previewView.height

    val facingFront = lenFacing == CameraType.FRONT
    val portrait = getDeviceOrientation() % 2 == 0
    val landscape = getDeviceOrientation() % 2 != 0

    if (facingFront && portrait) {
      cornerPoints.mapY { barCode.referenceImageHeight - cornerPoints[it] }
    }
    if (facingFront && landscape) {
      cornerPoints.mapX { barCode.referenceImageWidth  - cornerPoints[it] }
    }

    val scaleX = previewWidth / cameraWidth.toFloat()
    val scaleY = previewHeight / cameraHeight.toFloat()

    cornerPoints.mapX {
      (cornerPoints[it] * scaleX)
        .roundToInt()
    }
    cornerPoints.mapY {
      (cornerPoints[it] * scaleY)
        .roundToInt()
    }

    barCode.referenceImageHeight = height
    barCode.referenceImageWidth = width
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

  fun onBarCodeScanned(barCode: BarCodeScannerResult) {
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


  override fun setPreviewTexture(surfaceTexture: SurfaceTexture?) {
//    cameraView.setPreviewTexture(surfaceTexture)
  }

  override fun getPreviewSizeAsArray() = intArrayOf(previewView.width, previewView.height)

  override fun onHostResume() {

  }

  override fun onHostPause() {
  }

  override fun onHostDestroy() {
  }

  private fun hasCameraPermissions(): Boolean {
    val permissionsManager = appContext.permissions ?: return false
    return permissionsManager.hasGrantedPermissions(Manifest.permission.CAMERA)
  }

  init {
    isChildrenDrawingOrderEnabled = true
    val uIManager = appContext.legacyModule<UIManager>()
    uIManager!!.registerLifecycleEventListener(this)

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

  override fun onPictureSaved(response: Bundle) {
    onPictureSaved(PictureSavedEvent(response.getInt("id"), response.getBundle("data")!!))
  }

  private inner class BarcodeAnalysis : ImageAnalysis.Analyzer {
    @OptIn(ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {
      val mediaImage = imageProxy.image
      if (mediaImage != null) {
        val rotation = getCorrectCameraRotation(imageProxy.imageInfo.rotationDegrees, lenFacing)
        val image = InputImage.fromMediaImage(mediaImage, rotation)
        val options = BarcodeScannerOptions.Builder()
          .enableAllPotentialBarcodes()
          .build()

        val scanner = BarcodeScanning.getClient(options)
        scanner.process(image)
          .addOnSuccessListener { barcodes ->
            if (barcodes.isEmpty()) {
              return@addOnSuccessListener
            }
            val barcode = barcodes.first()
            val value = if (barcode.valueType == Barcode.TYPE_CONTACT_INFO) {
              barcode.rawValue ?: barcode.rawBytes?.let { String(it) }
            } else {
              barcode.displayValue
            }
            val cornerPoints = mutableListOf<Int>()
            barcode.cornerPoints?.let { points ->
              for (point in points) {
                cornerPoints.addAll(listOf(point.x, point.y))
              }
            }

            onBarCodeScanned(BarCodeScannerResult(barcode.format, value, cornerPoints, image.width, imageProxy.height))
          }
          .addOnFailureListener {
            Log.d("SCANNER", it.cause?.message ?: "Barcode scanning failed")
          }
          .addOnCompleteListener {
            imageProxy.close()
          }
      }
    }
  }
}
