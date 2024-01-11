package host.exp.exponent.utils

import host.exp.exponent.di.NativeModuleDepsProvider
import org.mockito.Matchers
import org.mockito.Mockito
import java.lang.RuntimeException
import java.lang.reflect.Field
import javax.inject.Inject

/*
 * Modified NativeModuleDepsProvider to inject mocks
 */
object MockExpoDI {
  private const val ENHANCER = "$\$EnhancerByMockitoWithCGLIB$$"

  // Use this instead of .getClass because mockito wraps our classes
  private fun typeOf(instance: Any): Class<out Any?> {
    var type: Class<out Any?> = instance.javaClass
    while (type.simpleName.contains(ENHANCER)) {
      type = type.superclass
    }
    return type
  }

  private var classesToInstances = mutableMapOf<Class<*>, Any>()

  fun clearMocks() {
    classesToInstances = mutableMapOf()
  }

  @JvmStatic fun addMock(vararg instances: Any) {
    for (instance in instances) {
      classesToInstances[typeOf(instance)] = instance
    }
  }

  @JvmStatic fun initialize() {
    val mockInstance = Mockito.mock(NativeModuleDepsProvider::class.java)
    Mockito.doAnswer { invocation ->
      val args = invocation.arguments
      inject(args[0] as Class<*>, args[1])
      null
    }.`when`(mockInstance).inject(Matchers.any(Class::class.java), Matchers.any())
    NativeModuleDepsProvider.setTestInstance(mockInstance)
  }

  private fun inject(clazz: Class<*>, target: Any) {
    for (field in clazz.declaredFields) {
      injectFieldInTarget(target, field)
    }
  }

  private fun injectFieldInTarget(target: Any, field: Field) {
    if (field.isAnnotationPresent(Inject::class.java)) {
      val fieldClazz = field.type
      if (!classesToInstances.containsKey(fieldClazz)) {
        throw RuntimeException("Mocked NativeModuleDepsProvider could not find object for class $fieldClazz")
      }
      val fieldObject = classesToInstances[fieldClazz]
      try {
        field.isAccessible = true
        field[target] = fieldObject
      } catch (e: IllegalAccessException) {
        throw RuntimeException(e)
      }
    }
  }
}
