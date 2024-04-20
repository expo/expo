package expo.modules.camera.legacy.tasks

import android.os.AsyncTask

import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult

class BarCodeScannerAsyncTask(
  private val delegate: BarCodeScannerAsyncTaskDelegate,
  private val barCodeScanner: BarCodeScannerInterface,
  private val imageData: ByteArray,
  private val width: Int,
  private val height: Int,
  private val rotation: Int
) : AsyncTask<Void?, Void?, BarCodeScannerResult?>() {
  override fun doInBackground(vararg params: Void?) = if (!isCancelled) {
    barCodeScanner.scan(imageData, width, height, rotation)
  } else {
    null
  }

  override fun onPostExecute(result: BarCodeScannerResult?) {
    super.onPostExecute(result)
    result?.let {
      delegate.onBarCodeScanned(result)
    }
    delegate.onBarCodeScanningTaskCompleted()
  }
}
