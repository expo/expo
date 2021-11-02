package expo.modules.kotlin.modules

import expo.modules.kotlin.methods.AnyMethod
import expo.modules.kotlin.views.ViewManagerDefinition

class ModuleDefinition(
  val name: String,
  val constantsProvider: () -> Map<String, Any?>,
  val methods: Map<String, AnyMethod>,
  val viewManagerDefinition: ViewManagerDefinition? = null
)
