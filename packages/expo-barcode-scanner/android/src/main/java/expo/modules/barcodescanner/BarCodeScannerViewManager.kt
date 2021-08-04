package expo.modules.barcodescanner

import android.content.Context
import expo.modules.core.ModuleRegistry
import expo.modules.core.ViewManager
import expo.modules.core.interfaces.ExpoProp
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import java.util.*

class BarCodeScannerViewManager : ViewManager<BarCodeScannerView?>() {
  private lateinit var mModuleRegistry: ModuleRegistry

  enum class Events(private val mName: String) {
    EVENT_ON_BAR_CODE_SCANNED("onBarCodeScanned");

    override fun toString() = mName
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry
  }

  override fun getName() = TAG

  override fun createViewInstance(context: Context) =
    BarCodeScannerView(context, mModuleRegistry)

  override fun getViewManagerType() = ViewManagerType.GROUP

  override fun getExportedEventNames() =
    Events.values().map { it.toString() }

  @ExpoProp(name = "type")
  fun setType(view: BarCodeScannerView, type: Int) {
    view.setCameraType(type)
  }

  @ExpoProp(name = "barCodeTypes")
  fun setBarCodeTypes(view: BarCodeScannerView, barCodeTypes: ArrayList<Double?>?) {
    if (barCodeTypes != null) {
      val settings: BarCodeScannerSettings = BarCodeScannerSettings().apply {
        putTypes(barCodeTypes)
      }
      view.setBarCodeScannerSettings(settings)
    }
  }

  companion object {
    private const val TAG = "ExpoBarCodeScannerView"
  }
}
