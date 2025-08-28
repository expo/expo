package expo.modules.cssview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class ExpoCssViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoCssView")

    View(ExpoCssView::class) {}
  }
}
