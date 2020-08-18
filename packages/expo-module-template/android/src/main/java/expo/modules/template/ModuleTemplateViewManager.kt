package expo.modules.template

import android.content.Context

import java.util.Arrays

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.ViewManager

class ModuleTemplateViewManager : ViewManager<ModuleTemplateView>() {

  private var mModuleRegistry: ModuleRegistry? = null

  override fun getName(): String {
    return TAG
  }

  override fun createViewInstance(context: Context): ModuleTemplateView {
    return ModuleTemplateView(context, mModuleRegistry!!)
  }

  override fun getViewManagerType(): ViewManager.ViewManagerType {
    return ViewManager.ViewManagerType.SIMPLE
  }

  override fun getExportedEventNames(): List<String> {
    return Arrays.asList("onSomethingHappened")
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry
  }

  companion object {
    private val TAG = "ExpoModuleTemplateView"
  }
}
