package expo.modules.v2

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.logger
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.ExpoModulesV2React
import io.github.expo.modules.v2.react.ReactRuntime
import java.lang.reflect.Modifier

class ExpoModulesV2Host {
  private var runtime: ReactRuntime? = null

  fun install(appContext: AppContext, reactContext: ReactApplicationContext) =
    synchronized(this) {
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

      try {
        // Must run before `ReactRuntime` initializes. Its superclass, kolibri's `NativeObject`,
        // otherwise loads the native library under kolibri's default name, which does not exist.
        ExpoModulesV2React.ensureLoaded()
        // The runtime does not own this context, so `close` below closes it too.
        val context = AppExpoContext(appContext, reactContext)
        val attached = ReactRuntime.attach(reactContext, context = context)
        val registered = modules.count { module -> register(attached, module) }
        if (registered == 0) {
          close(attached)
          return
        }
        runtime = attached
        logger.info("✅ Expo Modules v2 installed $registered module(s) on globalThis.expo.modules")
      } catch (e: Throwable) {
        logger.error("❌ Cannot install Expo Modules v2: $e", e)
      }
    }

  fun uninstall() = synchronized(this) {
    runtime?.let(::close)
    runtime = null
  }

  private fun register(runtime: ReactRuntime, module: Module): Boolean =
    try {
      runtime.moduleRegistry.register(module)
      true
    } catch (e: Throwable) {
      logger.error("❌ Cannot register the Expo Modules v2 module ${module.javaClass.name}: $e", e)
      false
    }

  private fun close(runtime: ReactRuntime) {
    // The same order as a runtime that owns its context: the context first, then the runtime.
    runtime.context.close()
    runtime.close()
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
