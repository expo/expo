package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import java.lang.ref.WeakReference

/**
 * Sets up a test jsi environment with provided modules.
 */
@OptIn(ExperimentalCoroutinesApi::class)
internal inline fun withJSIInterop(
  vararg modules: Module,
  block: JSIInteropModuleRegistry.(methodQueue: TestScope) -> Unit
) {
  val appContextMock = mockk<AppContext>()
  val methodQueue = TestScope()
  val registry = ModuleRegistry(WeakReference(appContextMock)).apply {
    modules.forEach {
      register(it)
    }
  }
  every { appContextMock.registry } answers { registry }
  every { appContextMock.modulesQueue } answers { methodQueue }

  val jsiIterop = JSIInteropModuleRegistry(appContextMock).apply {
    installJSIForTests()
  }

  block(jsiIterop, methodQueue)
}

/**
 * A syntax sugar that creates a new module from the definition block.
 */
internal inline fun inlineModule(
  crossinline block: ModuleDefinitionBuilder.() -> Unit
) = object : Module() {
  override fun definition() = ModuleDefinition { block.invoke(this) }
}

@Suppress("NOTHING_TO_INLINE")
@OptIn(ExperimentalCoroutinesApi::class)
@Throws(PromiseException::class)
internal inline fun JSIInteropModuleRegistry.waitForAsyncFunction(
  methodQueue: TestScope,
  jsCode: String
): JavaScriptValue {
  evaluateScript(
    """
    $jsCode.then(r => global.promiseResult = r).catch(e => global.promiseError = e)
    """.trimIndent()
  )

  methodQueue.testScheduler.advanceUntilIdle()
  drainJSEventLoop()

  if (global().hasProperty("promiseError")) {
    val jsError = global().getProperty("promiseError").getObject()
    val code = jsError.getProperty("code").getString()
    val errorMessage = jsError.getProperty("message").getString()
    throw PromiseException(code, errorMessage)
  }

  Truth
    .assertWithMessage("Promise wasn't resolved")
    .that(global().hasProperty("promiseResult")).isTrue()
  return global().getProperty("promiseResult")
}

class PromiseException(code: String, message: String) : CodedException(code, message, null)
