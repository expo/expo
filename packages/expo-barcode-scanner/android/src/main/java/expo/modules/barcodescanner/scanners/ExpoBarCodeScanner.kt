package expo.modules.barcodescanner.scanners

import android.content.Context
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings

abstract class ExpoBarCodeScanner internal constructor(protected var mContext: Context) : BarCodeScannerInterface {
  protected var barCodeTypes: List<Int>? = null
  fun areNewAndOldBarCodeTypesEqual(newBarCodeTypes: List<Int>?): Boolean {
    barCodeTypes?.run {
      // create distinct-values sets
      val prevTypesSet = toHashSet()
      val nextTypesSet = newBarCodeTypes?.toHashSet()

      // sets sizes are equal -> possible content equality
      if (nextTypesSet != null && prevTypesSet.size == nextTypesSet.size) {
        prevTypesSet.removeAll(nextTypesSet)
        // every element from new set was in previous one -> sets are equal
        return prevTypesSet.isEmpty()
      }
    }
    return false
  }

  fun parseBarCodeTypesFromSettings(settings: BarCodeScannerSettings): List<Int>? {
    val newBarCodeTypesObject = settings.types
    if (newBarCodeTypesObject == null || newBarCodeTypesObject !is List<*>) {
      return null
    }
    return newBarCodeTypesObject.filterIsInstance<Number>().map { it.toInt() }
  }
  abstract val isAvailable: Boolean
}
