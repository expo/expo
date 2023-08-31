package expo.modules.kotlin.defaultmodules

import expo.modules.kotlin.defaultmodules.uuid.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

class CoreModule : Module() {
  override fun definition() = ModuleDefinition {
    // Expose some common classes and maybe even the `modules` host object in the future.
    Function("getUuidv5") { name: String, namespace: String ->
      val namespaceUUID = try {
        UUID.fromString(namespace)
      } catch (e: IllegalArgumentException) {
        throw InvalidNamespaceException(namespace)
      }
      return@Function uuidv5(namespaceUUID, name).toString()
    }
  }
}
