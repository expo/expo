package expo.modules.contacts

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class ContactsPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(ContactsModule(context))
}
