package expo.modules.v2

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.logger
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.ExpoModulesV2React
import io.github.expo.modules.v2.react.ReactExpoContext
import io.github.expo.modules.v2.react.ReactRuntime
import java.lang.reflect.Modifier

/**
 * Installs the Expo Modules v2 modules into the React runtime of one `AppContext`. Each `AppContext`
 * owns a host, so each React instance gets its own modules, and destroying one instance does not
 * remove the modules of another.
 */
class ExpoModulesV2Host {
  private var runtime: ReactRuntime? = null
  private var context: ReactExpoContext? = null

  fun install(
    reactContext: ReactApplicationContext,
    contextFactory: (ReactApplicationContext) -> ReactExpoContext = ::ReactExpoContext
  ) = synchronized(this) {
    if (runtime != null) {
      logger.warn("⚠️ Expo Modules v2 was already installed")
      return
    }

    val modules = try {
      autolinkedModules()
    } catch (e: Throwable) {
      logger.error("❌ Cannot collect Expo Modules v2 modules: $e", e)
      return
    }

    if (modules.isEmpty()) {
      return
    }

    var newContext: ReactExpoContext? = null
    try {
      // Must run before `ReactRuntime` initializes. Its superclass, kolibri's `NativeObject`,
      // otherwise loads the native library under kolibri's default name, which does not exist.
      ExpoModulesV2React.ensureLoaded()
      newContext = contextFactory(reactContext)
      // A module that cannot be registered is left out, so the other modules still install.
      val registered = modules.count { module -> register(newContext, module) }
      if (registered == 0) {
        newContext.close()
        return
      }
      // The runtime serves the modules of the context, but does not close a context it was given.
      runtime = ReactRuntime.attach(reactContext, context = newContext)
      context = newContext
      logger.info("✅ Expo Modules v2 installed $registered module(s) on globalThis.expo.modules")
    } catch (e: Throwable) {
      // Closing the context frees its modules, so no module stays bound to it.
      newContext?.close()
      logger.error("❌ Cannot install Expo Modules v2: $e", e)
    }
  }

  fun uninstall() = synchronized(this) {
    try {
      // The same order as a runtime that owns its context: the modules get `onDestroy` while the
      // runtime is still alive.
      context?.close()
      runtime?.close()
    } finally {
      context = null
      runtime = null
    }
  }

  private fun register(context: ReactExpoContext, module: Module): Boolean =
    try {
      context.moduleRegistry.register(module)
      true
    } catch (e: Throwable) {
      // For example, a Kotlin `object` module is one instance, and it can belong to one open
      // context only. The host of a second React instance cannot register it.
      logger.error("❌ Cannot register the Expo Modules v2 module ${module.javaClass.name}: $e", e)
      false
    }

  private fun autolinkedModules(): List<Module> {
    val provider = try {
      Class.forName(GENERATED_PROVIDER_CLASS)
        .getConstructor()
        .newInstance() as ExpoModulesV2Provider
    } catch (_: ClassNotFoundException) {
      return emptyList()
    }
    return provider.getModules().map(::instantiate)
  }

  private fun instantiate(moduleClass: Class<out Module>): Module {
    val instanceField = moduleClass.declaredFields.firstOrNull {
      it.name == "INSTANCE" && Modifier.isStatic(it.modifiers)
    }

    if (instanceField != null) {
      instanceField.isAccessible = true
      return instanceField.get(null) as Module
    }

    return moduleClass.getDeclaredConstructor().apply { isAccessible = true }.newInstance()
  }

  private companion object {
    const val GENERATED_PROVIDER_CLASS = "expo.modules.ExpoModulesV2ModuleList"
  }
}
