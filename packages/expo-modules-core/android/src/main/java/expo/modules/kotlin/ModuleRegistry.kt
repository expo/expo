package expo.modules.kotlin

import android.view.View
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.views.ViewManagerDefinition
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.lang.ref.WeakReference

class ModuleRegistry(
  private val appContextHolder: WeakReference<AppContext>
) : Iterable<ModuleHolder<*>> {
  @PublishedApi
  internal val registry = mutableMapOf<String, ModuleHolder<*>>()

  private val eventQueue = mutableListOf<PostponedEvent>()

  private var isReadyForPostingEvents = false

  fun <T : Module> register(
    module: T,
    name: String?,
    packageName: String? = null
  ) = trace("ModuleRegistry.register(${module.javaClass})") {
    requireNotNull(appContextHolder.get()) { "Cannot register a module to an invalid app context." }

    module._appContextHolder = appContextHolder

    val holder = ModuleHolder(module, name, packageName)

    module.coroutineScopeDelegate = lazy {
      CoroutineScope(
        Dispatchers.Default +
          SupervisorJob() +
          CoroutineName(holder.name)
      )
    }

    registry[holder.name] = holder
  }

  /**
   * Registers modules exported by the given provider. Modules without a package name from the provider get [defaultPackageName].
   * Local modules are registered last, so they win over the modules of npm packages with the same name.
   */
  fun register(provider: ModulesProvider, defaultPackageName: String? = null) = apply {
    val packageNames = provider.getModulePackageNames()
    provider.getModulesMap().entries
      .map { (classifier, name) -> Triple(classifier, name, packageNames[classifier] ?: defaultPackageName) }
      .sortedBy { (_, _, packageName) -> packageName == ModulesProvider.LOCAL_PACKAGE_NAME }
      .forEach { (classifier, name, packageName) ->
        val module = classifier.getDeclaredConstructor().newInstance()
        register(module, name, packageName)
      }
  }

  fun register(vararg modules: Module) = apply {
    modules.forEach { module ->
      register(module, null)
    }
  }

  fun hasModule(name: String): Boolean = registry.containsKey(name)

  fun getModule(name: String): Module? = registry[name]?.module

  inline fun <reified T> getModule(): T? {
    return registry.values.find { it.module is T }?.module as? T
  }

  fun getModuleHolder(name: String): ModuleHolder<*>? = registry[name]

  /**
   * Returns the names of the packages of the registered modules, without duplicates. The local package comes first,
   * and the others are sorted.
   */
  fun getPackageNames(): List<String> =
    registry.values
      .mapNotNull { it.packageName }
      .distinct()
      .sortedWith(compareBy<String> { it != ModulesProvider.LOCAL_PACKAGE_NAME }.thenBy { it })

  /**
   * Returns whether any registered module is in the package with the given name.
   */
  fun hasPackage(packageName: String): Boolean = registry.values.any { it.packageName == packageName }

  /**
   * Returns the holders of the modules in the package with the given name, sorted by the module name.
   */
  fun getModuleHolders(packageName: String): List<ModuleHolder<*>> =
    registry.values.filter { it.packageName == packageName }.sortedBy { it.name }

  /**
   * Returns the names of the modules and shared object classes in the package with the given name. Module names
   * come first. A class whose name is already taken by a module or another class in the package is left out and logged.
   */
  fun getPackageExportNames(packageName: String): List<String> {
    val holders = getModuleHolders(packageName)
    val names = holders.mapTo(mutableListOf()) { it.name }
    val seenNames = names.toMutableSet()

    for (holder in holders) {
      for (className in holder.definition.classData.map { it.name }.sorted()) {
        if (seenNames.add(className)) {
          names.add(className)
        } else {
          logger.error(
            "Class '$className' from module '${holder.name}' is not available in 'expo.packages[\"$packageName\"]', " +
              "because another module or class in the '$packageName' package already has this name. " +
              "Rename the class or the module so that each name in the package is unique."
          )
        }
      }
    }
    return names
  }

  /**
   * Returns the name of the module that provides a module or a shared object class with the given name
   * in the package with the given name. For a module, it is the export name itself. Modules take precedence over classes.
   */
  fun getPackageExportOwner(packageName: String, exportName: String): String? {
    val holders = getModuleHolders(packageName)
    return holders.firstOrNull { it.name == exportName }?.name
      ?: holders.firstOrNull { holder -> holder.definition.classData.any { it.name == exportName } }?.name
  }

  @Suppress("UNCHECKED_CAST")
  fun <T : Module> getModuleHolder(module: T): ModuleHolder<T>? =
    registry.values.find { it.module === module } as? ModuleHolder<T>

  fun <T : View> getModuleHolder(viewClass: Class<T>): ModuleHolder<*>? {
    return registry.firstNotNullOfOrNull { (_, holder) ->
      holder.takeIf { getViewDefinition(holder, viewClass) != null }
    }
  }

  fun <T : View> getViewDefinition(holder: ModuleHolder<*>, viewClass: Class<T>): ViewManagerDefinition? {
    return holder.definition.viewManagerDefinitions.values.find { it.viewType == viewClass }
  }

  fun getViewDefinition(holder: ModuleHolder<*>, viewName: String): ViewManagerDefinition? {
    return holder.definition.viewManagerDefinitions.values.find { it.name == viewName }
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
