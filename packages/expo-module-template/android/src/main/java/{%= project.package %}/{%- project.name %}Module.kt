package <%- project.package %>

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class <%- project.name %>Module : Module() {
  override fun definition() = ModuleDefinition {
    Name("<%- project.name %>")

    AsyncFunction("helloAsync") { options: Map<String, String> ->
      println("Hello 👋")
    }

    ViewManager {
      View { context -> 
        <%- project.name %>View(context) 
      }

      Prop("name") { view: <%- project.name %>View, prop: String ->
        println(prop)
      }
    }
  }
}
