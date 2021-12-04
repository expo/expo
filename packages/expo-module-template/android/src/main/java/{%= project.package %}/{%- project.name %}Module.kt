package <%- project.package %>

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class <%- project.name %>Module : Module() {
  override fun definition() = ModuleDefinition {
    name("<%- project.name %>")

    function("helloAsync") { options: Map<String, String> ->
      println("Hello 👋")
    }

    viewManager {
      view { context -> 
        <%- project.name %>View(context) 
      }

      prop("name") { view: <%- project.name %>View, prop: String ->
        println(prop)
      }
    }
  }
}
