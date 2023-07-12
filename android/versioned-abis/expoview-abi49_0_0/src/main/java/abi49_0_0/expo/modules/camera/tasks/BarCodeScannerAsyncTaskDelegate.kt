package abi49_0_0.expo.modules.camera.tasks

import abi49_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerResult

interface BarCodeScannerAsyncTaskDelegate {
  fun onBarCodeScanned(barCode: BarCodeScannerResult)
  fun onBarCodeScanningTaskCompleted()
}
