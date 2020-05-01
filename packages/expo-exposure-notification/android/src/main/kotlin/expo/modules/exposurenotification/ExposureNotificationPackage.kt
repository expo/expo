package expo.modules.exposurenotification

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager

class ExposureNotificationPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ExposureNotificationModule(context) as ExportedModule)
  }

}
