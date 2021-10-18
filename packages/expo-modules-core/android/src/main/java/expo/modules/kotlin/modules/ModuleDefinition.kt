package expo.modules.kotlin.modules

import expo.modules.kotlin.methods.AnyMethod

class ModuleDefinition(
    val name: String,
    val constantsProvider: () -> Map<String, Any?>,
    val methods: Map<String, AnyMethod>
) {
  lateinit var type: Class<out Module>

  fun associateWithType(type: Class<out Module>) = apply {
    this.type = type
  }
}
