package expo.modules.test.core

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.JSTypeConverter
import java.lang.reflect.InvocationHandler
import java.lang.reflect.Method
import kotlin.reflect.KClass

/**
 * The promise rejection will be converted into this exception.
 */
class TestCodedException(
  code: String,
  message: String?,
  cause: Throwable?
) : Exception("[$code] $message", cause)

/**
 * Mocked module invocation handler which dispatches a call on test interface to the corresponding
 * exported function or to the module controller if the method doesn't exist in the module definition.
 *
 * Methods mapping:
 *   function("name") { args: ArgsType -> return ReturnType } can be invoked using one of the following methods mapping rules:
 *     - [non-promise mapping] fun ModuleTestInterface.name(args: ArgsType): ReturnType
 *     - [promise mapping] fun ModuleTestInterface.name(args: ArgsType, promise: Promise): Unit
 *
 *   function("name") { args: ArgsType, promise: Promise -> promise.resolve(ReturnType) } can be invoked using one of the following methods mapping rules:
 *     - [non-promise mapping] fun ModuleTestInterface.name(args: ArgsType): ReturnType
 *     - [promise mapping] fun ModuleTestInterface.name(args: ArgsType, promise: Promise): Unit
 *
 * In tests, the non-promise mapping should be preferred if possible.
 * The promise mapping should be only used when dealing with native async code.
 *
 * In the non-promise mapping, rejection will be converted into exceptions.
 * If you want to test if the method rejects, add the `@Throws` annotation to the `ModuleTestInterface` method you are testing.
 * Otherwise, the exception will be wrapped in `UndeclaredThrowableException`.
 */
class ModuleMockInvocationHandler<T : Any>(
  private val moduleTestInterface: KClass<T>,
  private val moduleController: ModuleController,
  private val holder: ModuleHolder
) : InvocationHandler {
  override fun invoke(proxy: Any, method: Method, args: Array<out Any>?): Any? {
    if (!holder.definition.methods.containsKey(method.name)) {
      return method.invoke(moduleController, *(args ?: emptyArray()))
    }

    return callExportedFunction(method.name, args)
  }

  private fun callExportedFunction(methodName: String, args: Array<out Any>?): Any? {
    val lastArg = args?.lastOrNull()
    if (Promise::class.java.isInstance(lastArg)) {
      promiseMappingCall(methodName, args!!.dropLast(1), lastArg as Promise)
      return Unit
    }

    return nonPromiseMappingCall(methodName, args)
  }

  private fun nonPromiseMappingCall(methodName: String, args: Array<out Any>?): Any? {
    val mockedPromise = PromiseMock()
    holder.call(methodName, convertArgs(args?.asList() ?: emptyList()), mockedPromise)

    when (mockedPromise.state) {
      PromiseState.RESOLVED -> {
        val moduleClassMethod = moduleTestInterface.members.firstOrNull { it.name == methodName }
          ?: throw IllegalStateException("Module class method '$methodName' not found")

        if (mockedPromise.resolveValue == null) {
          if (moduleClassMethod.returnType.isMarkedNullable) {
            return null
          }

          throw IllegalStateException("Method returns 'null' but the non-nullable type was expected")
        }

        if (!(moduleClassMethod.returnType.classifier as KClass<*>).isInstance(mockedPromise.resolveValue)) {
          throw IllegalStateException("Illegal return type ${mockedPromise.resolveValue?.javaClass}, expected ${moduleClassMethod.returnType.classifier}.")
        }

        return mockedPromise.resolveValue
      }
      PromiseState.REJECTED ->
        throw TestCodedException(
          mockedPromise.rejectCode!!,
          mockedPromise.rejectMessage,
          mockedPromise.rejectThrowable
        )
      PromiseState.NONE, PromiseState.ILLEGAL ->
        throw IllegalStateException("Illegal promise state '${mockedPromise.state}'")
    }
  }

  private fun promiseMappingCall(methodName: String, args: List<Any>, promise: Promise) {
    holder.call(methodName, convertArgs(args), promise)
  }

  private fun convertArgs(args: Iterable<Any?>): ReadableArray {
    return JSTypeConverter.convertToJSValue(args, TestJSContainerProvider) as ReadableArray
  }
}
