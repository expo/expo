package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

/**
 * We can't construct a `SuspendFunctionComponent` in the build phase, because it has to have access to module coroutine scope.
 * So we create another builder to store needed information and build it later - during the holder initialization.
 */
class SuspendFunctionComponentBuilder(
  internal val name: String,
  private val desiredArgsTypes: Array<AnyType>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?,
) {
  fun build(moduleHolder: ModuleHolder) =
    SuspendFunctionComponent(name, desiredArgsTypes, WeakReference(moduleHolder), body)
}

class SuspendFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val moduleHolderRef: WeakReference<ModuleHolder>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?
) : AsyncFunction(name, desiredArgsTypes) {
  @Throws(CodedException::class)
  override fun call(args: ReadableArray, promise: Promise) {
    callWithConvertedArguments(convertArgs(args), promise)
  }

  override fun call(args: Array<Any?>, promise: Promise) {
    callWithConvertedArguments(convertArgs(args), promise)
  }

  private fun callWithConvertedArguments(convertedArgs: Array<out Any?>, promise: Promise) {
    val holder = moduleHolderRef.get() ?: return
    val scope = holder.module.coroutineScopeDelegate.value

    scope.launch {
      try {
        val result = exceptionDecorator({ cause -> FunctionCallException(name, holder.name, cause) }) {
          body.invoke(scope, convertedArgs)
        }
        if (isActive) {
          promise.resolve(result)
        }
      } catch (e: CodedException) {
        promise.reject(e)
      } catch (e: Throwable) {
        promise.reject(UnexpectedException(e))
      }
    }
  }
}
