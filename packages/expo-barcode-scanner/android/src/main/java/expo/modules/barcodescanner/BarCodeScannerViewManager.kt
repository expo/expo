package expo.modules.barcodescanner

import android.content.Context
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.ViewManager
import expo.modules.core.interfaces.ExpoProp
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import java.util.*

class BarCodeScannerViewManager(
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ViewManager<BarCodeScannerView>() {

  enum class Events(private val mName: String) {
    EVENT_ON_BAR_CODE_SCANNED("onBarCodeScanned");

    override fun toString() = mName
  }

  override fun getName() = TAG

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun createViewInstance(context: Context) =
    BarCodeScannerView(context, moduleRegistryDelegate)

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
      val settings = BarCodeScannerSettings().apply {
        putTypes(barCodeTypes)
      }
      view.setBarCodeScannerSettings(settings)
    }
  }

  companion object {
    private const val TAG = "ExpoBarCodeScannerView"
  }
}
