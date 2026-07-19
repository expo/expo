package expo.modules.kotlin.services

import android.content.Context
import expo.modules.kotlin.AppContext
import kotlin.reflect.KClass

/**
 * Annotation to mark the interface of a service.
 * By default, the service is registered under its own class.
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.CLASS)
annotation class ServiceInterface(val clazz: KClass<out Service>)

/**
 * Marks a class as a service that can be retrieved from [expo.modules.kotlin.AppContext].
 */
interface Service {
  companion object {
    fun construct(
      serviceClass: Class<out Service>,
      appContext: AppContext
    ): Service {
      val context = requireNotNull(appContext.reactContext)
      val constructor = serviceClass.constructors.single()

      val parametersTypes = constructor.parameterTypes
      if (parametersTypes.isEmpty()) {
        return constructor.newInstance() as Service
      }

      if (parametersTypes.size != 1) {
        throw IllegalArgumentException("Service ${serviceClass.simpleName} has an invalid constructor.")
      }

      val parameterType = parametersTypes.single()
      if (parameterType == Context::class.java) {
        return constructor.newInstance(context) as Service
      }

      if (parameterType == AppContext::class.java) {
        return constructor.newInstance(appContext) as Service
      }

      throw IllegalArgumentException("Service ${serviceClass.simpleName} has an invalid constructor.")
    }
  }
}
