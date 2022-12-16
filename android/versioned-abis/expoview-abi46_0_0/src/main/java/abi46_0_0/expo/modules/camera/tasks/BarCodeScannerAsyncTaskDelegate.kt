package abi46_0_0.expo.modules.camera.tasks

import abi46_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerResult

interface BarCodeScannerAsyncTaskDelegate {
  fun onBarCodeScanned(barCode: BarCodeScannerResult)
  fun onBarCodeScanningTaskCompleted()
}
