package expo.modules.kotlin.services

import expo.modules.kotlin.AppContext
import java.lang.ref.WeakReference

class ServicesRegistry(
  private val appContextHolder: WeakReference<AppContext>
) {
  @PublishedApi
  internal val registry = mutableMapOf<Class<out Service>, Service>()

  fun register(serviceClass: Class<out Service>) = apply {
    val appContext = requireNotNull(appContextHolder.get()) {
      "Cannot register a service to an invalid app context."
    }

    val service = Service.construct(serviceClass, appContext)

    for (serviceInterface in getServiceInterfaces(service)) {
      registry[serviceInterface] = service
    }
  }

  fun register(serviceClasses: List<Class<out Service>>) = apply {
    serviceClasses.forEach { serviceClass ->
      register(serviceClass)
    }
  }

  inline fun <reified T : Service> register() = register(T::class.java)

  fun register(service: Service) = apply {
    for (serviceInterface in getServiceInterfaces(service)) {
      registry[serviceInterface] = service
    }
  }

  fun register(serviceClass: Class<out Service>, service: Service) = apply {
    registry[serviceClass] = service
  }

  private fun getServiceInterfaces(service: Service): List<Class<out Service>> {
    val serviceClass = service.javaClass

    val serviceInterfaces = serviceClass
      .getAnnotationsByType(ServiceInterface::class.java)
      .map { it.clazz.java }
      .takeIf { it.isNotEmpty() }
      ?: listOf(serviceClass)

    return serviceInterfaces
  }

  inline fun <reified T : Service> service(): T? {
    return registry[T::class.java] as? T
  }
}
