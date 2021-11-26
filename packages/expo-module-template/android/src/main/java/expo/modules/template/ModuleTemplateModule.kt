package expo.modules.template

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ModuleTemplateModule : Module() {
  override fun definition() = ModuleDefinition {
    name("ExpoModuleTemplate")

    function("someGreatMethodAsync") { options: Map<String, String> ->
      println("Hello 👋")
      null as Any?
    }

    viewManager {
      view { context -> 
        ModuleTemplateView(context) 
      }

      prop("someGreatProp") { view: ModuleTemplateView, prop: Int ->
        println(prop)
      }
    }
  }
}
