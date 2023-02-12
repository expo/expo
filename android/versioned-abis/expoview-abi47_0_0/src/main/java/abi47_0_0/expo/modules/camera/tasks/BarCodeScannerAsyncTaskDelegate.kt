package abi47_0_0.expo.modules.camera.tasks

import abi47_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerResult

interface BarCodeScannerAsyncTaskDelegate {
  fun onBarCodeScanned(barCode: BarCodeScannerResult)
  fun onBarCodeScanningTaskCompleted()
}
