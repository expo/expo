package expo.modules.constants

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.interfaces.InternalModule

class ConstantsPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> =
    listOf(ConstantsService(context))
}
