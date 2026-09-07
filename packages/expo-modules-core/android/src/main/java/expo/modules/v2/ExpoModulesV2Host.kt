package expo.modules.v2

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.logger
import io.github.expo.modules.v2.modules.Module
import io.github.expo.modules.v2.modules.ModuleRegistry
import io.github.expo.modules.v2.react.ReactRuntime
import java.lang.reflect.Modifier

object ExpoModulesV2Host {
  private const val GENERATED_PROVIDER_CLASS = "expo.modules.ExpoModulesV2ModuleList"

  private var runtime: ReactRuntime? = null

  fun install(reactContext: ReactApplicationContext) =
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
        val registry = ModuleRegistry()
        modules.forEach(registry::register)
        runtime = ReactRuntime.attach(reactContext, registry)
        logger.info("✅ Expo Modules v2 installed ${modules.size} module(s) on globalThis.expoV2")
      } catch (e: Throwable) {
        logger.error("❌ Cannot install Expo Modules v2: $e", e)
      }
    }

  fun uninstall() = synchronized(this) {
    runtime?.close()
    runtime = null
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
}
