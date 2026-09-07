package expo.modules.kotlin.functions

import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.ConverterContext
import kotlinx.coroutines.CoroutineScope

sealed interface FunctionQueue

enum class Queues : FunctionQueue {
  MAIN,
  DEFAULT
}

data class CustomQueue(
  val scope: CoroutineScope
) : FunctionQueue

abstract class BaseAsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : AnyFunction(name, desiredArgsTypes) {
  protected var queue: FunctionQueue = Queues.DEFAULT

  /**
   * Indexes of the arguments that JS passes as a shared object id.
   */
  private val sharedObjectArgsIndices: IntArray by lazy {
    desiredArgsTypes
      .indices
      .filter { index -> desiredArgsTypes[index].getCppRequiredTypes().containsSharedObjectId() }
      .toIntArray()
  }

  /**
   * Async functions convert their arguments on another queue, after the JS call has returned.
   * A shared object arrives as an id, so nothing keeps its JS object alive in the meantime.
   * If the garbage collector takes that JS object first, the registry entry is removed and
   * the conversion fails with [expo.modules.kotlin.exception.UsingReleasedSharedObjectException].
   *
   * This returns strong references to the JS objects behind the shared object arguments.
   * The caller has to keep them until the arguments are converted.
   * It has to be called on the JS thread, where the arguments are still reachable from JS.
   */
  protected fun retainSharedObjects(args: Array<Any?>, converterContext: ConverterContext): MutableList<JavaScriptObject> {
    if (sharedObjectArgsIndices.isEmpty()) {
      return mutableListOf()
    }

    val runtime = converterContext.runtime ?: return mutableListOf()
    val retained = mutableListOf<JavaScriptObject>()
    for (index in sharedObjectArgsIndices) {
      val id = args.getOrNull(index) as? Int ?: continue
      val jsObject = runCatching { SharedObjectId(id).toJavaScriptObjectNull(runtime) }.getOrNull()
      if (jsObject != null) {
        retained.add(jsObject)
      }
    }
    return retained
  }

  fun runOnQueue(queue: Queues) = apply {
    this.queue = queue
  }

  fun runOnQueue(scope: CoroutineScope) = apply {
    this.queue = CustomQueue(scope)
  }
}

/**
 * Checks if the type, or one of the types it wraps, is passed from JS as a shared object id.
 * A nullable shared object, for instance, wraps the id in [CppType.NULLABLE].
 */
private fun ExpectedType.containsSharedObjectId(): Boolean {
  if (getCombinedTypes() and CppType.SHARED_OBJECT_ID.value != 0) {
    return true
  }
  return getPossibleTypes().any { it.getFirstParameterType()?.containsSharedObjectId() == true }
}
