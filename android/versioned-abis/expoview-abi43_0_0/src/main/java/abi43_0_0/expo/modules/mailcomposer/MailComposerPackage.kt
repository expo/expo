package abi43_0_0.expo.modules.mailcomposer

import android.content.Context
import abi43_0_0.expo.modules.core.BasePackage

class MailComposerPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(MailComposerModule(context))
}
