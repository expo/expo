package expo.modules.kotlin.defaultmodules

import android.content.Context
import android.net.Uri
import com.facebook.react.ReactActivity
import expo.modules.BuildConfig
import expo.modules.kotlin.events.normalizeEventName
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.DEFAULT_MODULE_VIEW
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.uuidv5.InvalidNamespaceException
import expo.modules.kotlin.uuidv5.uuidv5
import java.util.UUID

class CoreModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  override fun definition() = ModuleDefinition {
    Property("expoModulesCoreVersion") {
      val version = BuildConfig.EXPO_MODULES_CORE_VERSION
      val (major, minor, patch) = version
        .split("-")
        .first()
        .split(".")
        .map { it.toInt() }

      return@Property mapOf(
        "version" to version,
        "major" to major,
        "minor" to minor,
        "patch" to patch
      )
    }

    Property("cacheDir") {
      return@Property Uri.fromFile(context.cacheDir).toString() + "/"
    }

    Property("documentsDir") {
      return@Property Uri.fromFile(context.filesDir).toString() + "/"
    }

    // Expose some common classes and maybe even the `modules` host object in the future.
    Function("uuidv4") {
      return@Function UUID.randomUUID().toString()
    }

    Function("uuidv5") { name: String, namespace: String ->
      val namespaceUUID = try {
        UUID.fromString(namespace)
      } catch (_: IllegalArgumentException) {
        throw InvalidNamespaceException(namespace)
      }
      return@Function uuidv5(namespaceUUID, name).toString()
    }

    Function("getViewConfig") { moduleName: String, viewName: String? ->
      val holder = runtimeContext.registry.getModuleHolder(moduleName)
        ?: return@Function null

      val viewManagerDefinition = holder
        .definition
        .viewManagerDefinitions[viewName ?: DEFAULT_MODULE_VIEW]
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
