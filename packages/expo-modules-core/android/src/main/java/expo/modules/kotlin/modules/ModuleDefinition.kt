package expo.modules.kotlin.modules

import expo.modules.kotlin.methods.AnyMethod

class ModuleDefinition(
  val name: String,
  val constantsProvider: () -> Map<String, Any?>,
  val methods: Map<String, AnyMethod>
)
