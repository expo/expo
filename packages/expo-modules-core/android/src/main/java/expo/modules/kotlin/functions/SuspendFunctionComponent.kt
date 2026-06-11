package expo.modules.kotlin.functions

import android.view.View
import expo.modules.BuildConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.weak
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.android.awaitFrame
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SuspendFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {
  private val takesViewAsOwner: Boolean
    get() {
      if (!takesOwner) {
        return false
      }
      val firstArgClass = desiredArgsTypes.firstOrNull()?.typeDescriptor?.jClass ?: return false
      return View::class.java.isAssignableFrom(firstArgClass)
    }

  override fun attachToJSObject(appContext: AppContext, jsObject: JSDecoratorsBridgingObject, moduleName: String) {
    val appContextHolder = appContext.weak()
    jsObject.registerAsyncFunction(
      name,
      takesOwner,
      isEnumerable,
      desiredArgsTypes.map { it.getCppRequiredTypes() }.toTypedArray()
    ) { args, promiseImpl ->
      if (BuildConfig.DEBUG) {
        promiseImpl.decorateWithDebugInformation(
          appContextHolder,
          moduleName,
          name
        )
      }

      val scope = when (val queue = queue) {
        Queues.MAIN -> appContext.mainQueue
        Queues.DEFAULT -> appContext.modulesQueue
        is CustomQueue -> queue.scope
      }

      scope.launch {
        try {
          exceptionDecorator({
            FunctionCallException(name, moduleName, it)
          }) {
            val convertedArgs = if (takesViewAsOwner) {
              retryOnViewNotFound { convertArgs(args, appContext) }
            } else {
              convertArgs(args, appContext)
            }
            val result = body.invoke(this, convertedArgs)
            if (isActive) {
              promiseImpl.resolve(result)
            }
          }
        } catch (e: Throwable) {
          if (promiseImpl.wasSettled) {
            throw e
          }
          promiseImpl.reject(e.toCodedException())
        }
      }
    }
  }
}

/**
 * Retries [attempt] across UI frames while it fails with [Exceptions.ViewNotFound].
 * A view function dispatched right after a commit (e.g. from the first `useEffect`)
 * can reach the main queue before the UIManager mounts the target view, so the
 * lookup succeeds once the mounting layer flushes on a subsequent frame.
 */
internal suspend fun <T> retryOnViewNotFound(
  maxFrames: Int = VIEW_MOUNT_MAX_FRAMES,
  awaitNextFrame: suspend () -> Unit = { awaitFrame() },
  attempt: () -> T
): T {
  repeat(maxFrames) {
    try {
      return attempt()
    } catch (e: CodedException) {
      if (!e.isCausedByViewNotFound()) {
        throw e
      }
    }
    awaitNextFrame()
  }
  return attempt()
}

private fun CodedException.isCausedByViewNotFound(): Boolean {
  var cause: Throwable? = this
  while (cause != null) {
    if (cause is Exceptions.ViewNotFound) {
      return true
    }
    cause = cause.cause
  }
  return false
}

private const val VIEW_MOUNT_MAX_FRAMES = 60
