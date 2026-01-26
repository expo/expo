package host.exp.exponent.home.qrScanner

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.mlkit.vision.MlKitAnalyzer
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class QRScannerActivity : ComponentActivity() {
  class Contract: ActivityResultContract<Unit, String?>() {
    override fun createIntent(context: Context, input: Unit): Intent {
      return Intent(context, QRScannerActivity::class.java)
    }

    override fun parseResult(resultCode: Int, intent: Intent?): String? {
      return if (resultCode == RESULT_OK) {
        intent?.getStringExtra("data")
      } else {
        null
      }
    }
  }

  private lateinit var cameraExecutor: ExecutorService
  private val isScanned = AtomicBoolean(false)

  private val requestPermissionLauncher =
    registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
      if (isGranted) {
        startCamera()
      } else {
        Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
        finish()
      }
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    cameraExecutor = Executors.newSingleThreadExecutor()

    val cameraPermission = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
    if (cameraPermission == PackageManager.PERMISSION_GRANTED) {
      startCamera()
    } else {
      requestPermissionLauncher.launch(Manifest.permission.CAMERA)
    }
  }

  private fun startCamera() {
    setContent {
      Box(modifier = Modifier.fillMaxSize()) {
        CameraPreview(
          onBarcodeDetected = { url ->
            if (isScanned.compareAndSet(false, true)) {
              setResult(Activity.RESULT_OK, Intent().apply { putExtra("data", url) })
              finish()
            }
          }
        )
        QRScannerOverlay()
      }
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    cameraExecutor.shutdown()
  }

  @Composable
  private fun CameraPreview(onBarcodeDetected: (String) -> Unit) {
    AndroidView(
      factory = { context ->
        val previewView = PreviewView(context)
        previewView.layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
        previewView.scaleType = PreviewView.ScaleType.FILL_CENTER

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
          val cameraProvider = cameraProviderFuture.get()
          val preview = Preview.Builder().build()
          preview.surfaceProvider = previewView.surfaceProvider

          val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
            .build()
          val barcodeScanner = BarcodeScanning.getClient(options)

          val imageAnalysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()

          val analyzer = MlKitAnalyzer(
            listOf(barcodeScanner),
            ImageAnalysis.COORDINATE_SYSTEM_ORIGINAL,
            ContextCompat.getMainExecutor(context)
          ) { result: MlKitAnalyzer.Result? ->
            val barcodeResults = result?.getValue(barcodeScanner)
            if (!barcodeResults.isNullOrEmpty()) {
              val first = barcodeResults.first()
              first.rawValue?.let {
                onBarcodeDetected(it)
              }
            }
          }

          imageAnalysis.setAnalyzer(cameraExecutor, analyzer)

          try {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
              this,
              CameraSelector.DEFAULT_BACK_CAMERA,
              preview,
              imageAnalysis
            )
          } catch (exc: Exception) {
            exc.printStackTrace()
          }
        }, ContextCompat.getMainExecutor(context))

        previewView
      },
      modifier = Modifier.fillMaxSize()
    )
  }
}
