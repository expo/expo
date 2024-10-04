package expo.modules.kotlin

import android.view.View
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.tracing.trace
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.lang.ref.WeakReference

class ModuleRegistry(
  private val runtimeContext: WeakReference<RuntimeContext>
) : Iterable<ModuleHolder<*>> {
  @PublishedApi
  internal val registry = mutableMapOf<String, ModuleHolder<*>>()

  private val eventQueue = mutableListOf<PostponedEvent>()

  private var isReadyForPostingEvents = false

  fun <T : Module> register(module: T) = trace("ModuleRegistry.register(${module.javaClass})") {
    module._runtimeContext = requireNotNull(runtimeContext.get()) { "Cannot create a module for invalid runtime context." }

    val holder = ModuleHolder(module)

    module.coroutineScopeDelegate = lazy {
      CoroutineScope(
        Dispatchers.Default +
          SupervisorJob() +
          CoroutineName(holder.definition.name)
      )
    }

    registry[holder.name] = holder
  }

  fun register(vararg modules: Module) {
    modules.forEach { register(it) }
  }

  fun register(provider: ModulesProvider) = apply {
    provider.getModulesList().forEach { type ->
      val module = type.getDeclaredConstructor().newInstance()
      register(module)
    }
  }

  fun hasModule(name: String): Boolean = registry.containsKey(name)

  fun getModule(name: String): Module? = registry[name]?.module

  inline fun <reified T> getModule(): T? {
    return registry.values.find { it.module is T }?.module as? T
  }

  fun getModuleHolder(name: String): ModuleHolder<*>? = registry[name]

  @Suppress("UNCHECKED_CAST")
  fun <T : Module> getModuleHolder(module: T): ModuleHolder<T>? =
    registry.values.find { it.module === module } as? ModuleHolder<T>

  fun <T : View> getModuleHolder(viewClass: Class<T>): ModuleHolder<*>? {
    return registry.firstNotNullOfOrNull { (_, holder) ->
      if (holder.definition.viewManagerDefinition?.viewType == viewClass) {
        holder
      } else {
        null
      }
    }
  }

  /**
   * Post onCreate event to all modules. It has its own method to ensure that it’s called first.
   */
  fun postOnCreate() {
    forEach {
      it.post(EventName.MODULE_CREATE)
    }
    registerActivityContracts()
    readyForPostingEvents()
    flushTheEventQueue()
  }

  fun post(eventName: EventName) {
    if (addToQueueIfNeeded(eventName)) {
      return
    }

    forEach {
      it.post(eventName)
    }
  }

  fun <Sender> post(eventName: EventName, sender: Sender) {
    if (addToQueueIfNeeded(eventName, sender)) {
      return
    }

    forEach {
      it.post(eventName, sender)
    }
  }

  fun <Sender, Payload> post(eventName: EventName, sender: Sender, payload: Payload) {
    if (addToQueueIfNeeded(eventName, sender, payload)) {
      return
    }

    forEach {
      it.post(eventName, sender, payload)
    }
  }

  override fun iterator(): Iterator<ModuleHolder<*>> = registry.values.iterator()

  fun cleanUp() {
    registry.clear()
    logger.info("✅ ModuleRegistry was destroyed")
  }

  internal fun registerActivityContracts() {
    forEach { holder ->
      holder.registerContracts()
    }
  }

  /**
   * Tell the modules registry it can handle events as they come, without adding them to the event queue.
   */
  private fun readyForPostingEvents() = synchronized(this) {
    isReadyForPostingEvents = true
  }

  private fun flushTheEventQueue() = synchronized(this) {
    eventQueue.forEach { event ->
      forEach {
        event.post(it)
      }
    }
    eventQueue.clear()
  }

  /**
   * It’s important that the [EventName.MODULE_CREATE] event is emitted first by the registry.
   * However, some events like [EventName.ACTIVITY_ENTERS_FOREGROUND] are automatically emitted when the catalyst instance is created.
   * To ensure the correct order of events, we capture all events that are emitted
   * during the initialization phase and send them back to the modules later.
   * This way, we can ensure that the order of events is correct.
   */
  private fun addToQueueIfNeeded(
    eventName: EventName,
    sender: Any? = null,
    payload: Any? = null
  ): Boolean = synchronized(this) {
    if (isReadyForPostingEvents) {
      return false
    }

    eventQueue.add(PostponedEvent(eventName, sender, payload))
    return true
  }

  data class PostponedEvent(
    val eventName: EventName,
    val sender: Any? = null,
    val payload: Any? = null
  ) {
    fun post(moduleHolder: ModuleHolder<*>) {
      if (sender != null && payload != null) {
        moduleHolder.post(eventName, sender, payload)
        return
      }

      if (sender != null) {
        moduleHolder.post(eventName, sender)
        return
      }

      moduleHolder.post(eventName)
    }
  }
}
