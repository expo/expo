package expo.modules.storereview

import android.content.Context
import expo.modules.core.BasePackage

class StoreReviewPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(StoreReviewModule(context))
}
