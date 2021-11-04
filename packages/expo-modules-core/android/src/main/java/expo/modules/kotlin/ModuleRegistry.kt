package expo.modules.kotlin

import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.modules.Module
import java.lang.ref.WeakReference

class ModuleRegistry(
  private val appContext: WeakReference<AppContext>
) : Iterable<ModuleHolder> {
  private val registry = mutableMapOf<String, ModuleHolder>()

  fun register(module: Module) {
    val holder = ModuleHolder(module)
    module._appContext = requireNotNull(appContext.get()) { "Cannot create a module for invalid app context." }
    holder.post(EventName.MODULE_CREATE)
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

  fun getModuleHolder(name: String): ModuleHolder? = registry[name]

  fun post(eventName: EventName) {
    iterator().forEach {
      it.post(eventName)
    }
  }

  @Suppress("UNCHECKED_CAST")
  fun <Sender> post(eventName: EventName, sender: Sender) {
    iterator().forEach {
      it.post(eventName, sender)
    }
  }

  @Suppress("UNCHECKED_CAST")
  fun <Sender, Payload> post(eventName: EventName, sender: Sender, payload: Payload) {
    iterator().forEach {
      it.post(eventName, sender, payload)
    }
  }

  override fun iterator(): Iterator<ModuleHolder> = registry.values.iterator()
}
