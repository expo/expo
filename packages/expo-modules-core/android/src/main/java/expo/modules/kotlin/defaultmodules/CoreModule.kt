package expo.modules.kotlin.defaultmodules

import com.facebook.react.ReactActivity
import expo.modules.kotlin.events.normalizeEventName
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.uuidv5.InvalidNamespaceException
import expo.modules.kotlin.uuidv5.uuidv5
import java.util.UUID

class CoreModule : Module() {
  override fun definition() = ModuleDefinition {
    // Expose some common classes and maybe even the `modules` host object in the future.
    Function("uuidv4") {
      return@Function UUID.randomUUID().toString()
    }

    Function("uuidv5") { name: String, namespace: String ->
      val namespaceUUID = try {
        UUID.fromString(namespace)
      } catch (e: IllegalArgumentException) {
        throw InvalidNamespaceException(namespace)
      }
      return@Function uuidv5(namespaceUUID, name).toString()
    }

    Function("getViewConfig") { viewName: String ->
      val holder = runtimeContext.registry.getModuleHolder(viewName)
        ?: return@Function null

      val viewManagerDefinition = holder.definition.viewManagerDefinition
        ?: return@Function null

      val validAttributes = viewManagerDefinition
        .props
        .keys
        .associateWith { true }

      val directEventTypes = viewManagerDefinition
        .callbacksDefinition
        ?.names
        ?.associate {
          val normalizedEventName = normalizeEventName(it)
          normalizedEventName to mapOf(
            "registrationName" to it
          )
        }

      return@Function mapOf(
        "validAttributes" to validAttributes,
        "directEventTypes" to directEventTypes
      )
    }

    AsyncFunction("reloadAppAsync") { _: String ->
      val reactActivity = appContext.throwingActivity as? ReactActivity ?: return@AsyncFunction
      val reactDelegate = reactActivity.reactDelegate ?: return@AsyncFunction
      reactDelegate.reload()
    }
  }
}
