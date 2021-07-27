package expo.modules.sms

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class SMSPackage : BasePackage() {
  override fun createExportedModules(reactContext: Context): List<ExportedModule> {
    return listOf(SMSModule(reactContext))
  }
}
