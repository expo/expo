package expo.modules.kotlin

import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.modules.Module
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.lang.ref.WeakReference

class ModuleRegistry(
  private val appContext: WeakReference<AppContext>
) : Iterable<ModuleHolder> {
  @PublishedApi
  internal val registry = mutableMapOf<String, ModuleHolder>()

  fun register(module: Module) {
    val holder = ModuleHolder(module)
    module._appContext = requireNotNull(appContext.get()) { "Cannot create a module for invalid app context." }
    module.coroutineScopeDelegate = lazy {
      CoroutineScope(
        Dispatchers.Default +
          SupervisorJob() +
          CoroutineName(holder.definition.name)
      )
    }
    holder.post(EventName.MODULE_CREATE)
    holder.registerContracts()
    registry[holder.name] = holder
  }

  fun register(provider: ModulesProvider) = apply {
    provider.getModulesList().forEach { type ->
      val module = type.newInstance()
      register(module)
    }
  }

  fun hasModule(name: String): Boolean = registry.containsKey(name)

  fun getModule(name: String): Module? = registry[name]?.module

  inline fun <reified T> getModule(): T? {
    return registry.values.find { it.module is T }?.module as? T
  }

  fun getModuleHolder(name: String): ModuleHolder? = registry[name]

  fun getModuleHolder(module: Module): ModuleHolder? =
    registry.values.find { it.module === module }

  fun post(eventName: EventName) {
    forEach {
      it.post(eventName)
    }
  }

  @Suppress("UNCHECKED_CAST")
  fun <Sender> post(eventName: EventName, sender: Sender) {
    forEach {
      it.post(eventName, sender)
    }
  }

  @Suppress("UNCHECKED_CAST")
  fun <Sender, Payload> post(eventName: EventName, sender: Sender, payload: Payload) {
    forEach {
      it.post(eventName, sender, payload)
    }
  }

  override fun iterator(): Iterator<ModuleHolder> = registry.values.iterator()

  fun cleanUp() {
    forEach {
      it.cleanUp()
    }
    registry.clear()
    logger.info("✅ ModuleRegistry was destroyed")
  }
}
