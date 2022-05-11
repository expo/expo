package expo.modules.webbrowser

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.ExportedModule

class WebBrowserPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> = listOf(
    InternalCustomTabsActivitiesHelper(),
    InternalCustomTabsConnectionHelper(context)
  )

  override fun createExportedModules(context: Context): List<ExportedModule> = emptyList()
}
