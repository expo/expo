package expo.modules.kotlin

import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.modules.Module
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import kotlin.reflect.full.declaredMemberProperties

class ModuleRegistry(
  private val appContext: WeakReference<AppContext>
) : Iterable<ModuleHolder> {
  @PublishedApi
  internal val registry = mutableMapOf<String, ModuleHolder>()

  fun register(module: Module) {
    module._appContext = requireNotNull(appContext.get()) { "Cannot create a module for invalid app context." }

    val holder = ModuleHolder(module)

    module.coroutineScopeDelegate = lazy {
      CoroutineScope(
        Dispatchers.Default +
          SupervisorJob() +
          CoroutineName(holder.definition.name)
      )
    }

    holder.apply {
      post(EventName.MODULE_CREATE)
      registerContracts()

      // The initial invocation of `declaredMemberProperties` appears to be slow,
      // as Kotlin must deserialize metadata internally.
      // This is a known issue that may be resolved by the new K2 compiler in the future.
      // However, until then, we must find a way to address this problem.
      // Therefore, we have decided to dispatch a lambda
      // that invokes `declaredMemberProperties` during module creation.
      viewClass()?.let { viewType ->
        appContext.get()?.backgroundCoroutineScope?.launch {
          viewType.declaredMemberProperties
        }
      }
    }

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
    registry.clear()
    logger.info("✅ ModuleRegistry was destroyed")
  }
}
