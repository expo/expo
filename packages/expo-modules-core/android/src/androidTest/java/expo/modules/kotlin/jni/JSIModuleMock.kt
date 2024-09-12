@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import android.view.View
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.uimanager.UIBlock
import com.facebook.react.uimanager.UIManagerModule
import com.google.common.truth.Truth
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.defaultmodules.CoreModule
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.tests.RuntimeHolder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import expo.modules.kotlin.sharedobjects.ClassRegistry
import expo.modules.kotlin.sharedobjects.SharedObjectRegistry
import expo.modules.kotlin.weak
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope

private fun defaultAppContextMock(): Pair<AppContext, RuntimeContext> {
  val appContextMock = mockk<AppContext>()
  val runtimeContext = mockk<RuntimeContext>()
  val classRegistry = ClassRegistry()

  every { runtimeContext.classRegistry } answers { classRegistry }
  every { runtimeContext.appContext } answers { appContextMock }
  every { appContextMock.findView<View>(capture(slot())) } answers { mockk() }
  every { appContextMock.hostingRuntimeContext } answers { runtimeContext }

  return appContextMock to runtimeContext
}

/**
 * Sets up a test jsi environment with provided modules.
 */
@OptIn(ExperimentalCoroutinesApi::class, FrameworkAPI::class)
internal inline fun withJSIInterop(
  vararg modules: Module,
  numberOfReloads: Int = 1,
  block: JSIContext.(methodQueue: TestScope) -> Unit
) {
  val (appContextMock, runtimeContext) = defaultAppContextMock()
  val methodQueue = TestScope()

  val uiManagerModuleMock = mockk<UIManagerModule>()
  val slot = slot<UIBlock>()
  every { uiManagerModuleMock.addUIBlock(capture(slot)) } answers {
    methodQueue.launch {
      slot.captured.execute(mockk())
    }
  }

  val catalystInstanceMock = mockk<CatalystInstance>()
  every { catalystInstanceMock.getNativeModule(UIManagerModule::class.java) } answers { uiManagerModuleMock }

  val reactContextMock = mockk<ReactContext>()
  every { reactContextMock.isBridgeless } answers { false }
  every { reactContextMock.hasCatalystInstance() } answers { true }
  every { reactContextMock.hasActiveReactInstance() } answers { true }
  every { reactContextMock.catalystInstance } answers { catalystInstanceMock }

  every { appContextMock.modulesQueue } answers { methodQueue }
  every { appContextMock.mainQueue } answers { methodQueue }
  every { appContextMock.backgroundCoroutineScope } answers { methodQueue }
  every { appContextMock.reactContext } answers { reactContextMock }
  every { appContextMock.assertMainThread() } answers { }

  val functionSlot = slot<() -> Unit>()
  every { appContextMock.dispatchOnMainUsingUIManager(capture(functionSlot)) } answers {
    functionSlot.captured.invoke()
  }

  val jniDeallocator = JNIDeallocator(shouldCreateDestructorThread = false)
  repeat(numberOfReloads) {
    val coreModule = run {
      val module = CoreModule()
      module._runtimeContext = runtimeContext
      ModuleHolder(module)
    }
    every { runtimeContext.coreModule } answers { coreModule }

    val registry = ModuleRegistry(appContextMock.hostingRuntimeContext.weak()).apply {
      modules.forEach {
        register(it)
      }
    }
    val sharedObjectRegistry = SharedObjectRegistry(appContextMock.hostingRuntimeContext)
    every { appContextMock.registry } answers { registry }
    every { runtimeContext.registry } answers { registry }
    every { runtimeContext.sharedObjectRegistry } answers { sharedObjectRegistry }

    // We aim to closely replicate the lifecycle of each part as it functions in the real app.
    // That’s why the JSIContext outlives the JS runtime.
    JSIContext().use { jsiContext ->
      every { runtimeContext.jniDeallocator } answers { jniDeallocator }
      every { runtimeContext.jsiContext } answers { jsiContext }

      RuntimeHolder().use { runtimeHolder ->
        val runtimePtr = runtimeHolder.createRuntime()
        val callInvokerHolder = runtimeHolder.createCallInvoker()

        jsiContext.installJSI(runtimeContext, runtimePtr, callInvokerHolder)

        jniDeallocator.use {
          block(jsiContext, methodQueue)
        }
      }
    }
  }
  Truth.assertWithMessage("Memory leak detected").that(jniDeallocator.inspectMemory()).isEmpty()
}

open class TestContext(
  val jsiInterop: JSIContext,
  val methodQueue: TestScope
) {
  fun global() = jsiInterop.global()
  fun evaluateScript(script: String) = jsiInterop.evaluateScript(script)
  fun evaluateScript(vararg script: String) =
    jsiInterop.evaluateScript(script.joinToString(separator = "\n"))

  fun waitForAsyncFunction(jsCode: String) = jsiInterop.waitForAsyncFunction(methodQueue, jsCode)
}

class SingleTestContext(
  moduleName: String,
  jsiInterop: JSIContext,
  methodQueue: TestScope
) : TestContext(jsiInterop, methodQueue) {
  val moduleRef = "expo.modules.$moduleName"

  fun property(propertyName: String) =
    jsiInterop.evaluateScript("$moduleRef.$propertyName")

  fun property(propertyName: String, newValue: String) {
    jsiInterop.evaluateScript("$moduleRef.$propertyName = $newValue")
  }

  fun call(functionName: String, args: String = "") = jsiInterop.evaluateScript(
    "$moduleRef.$functionName($args)"
  )

  fun callClass(className: String, functionName: String? = null, args: String = ""): JavaScriptValue {
    if (functionName == null) {
      return jsiInterop.evaluateScript("new $moduleRef.$className()")
    }

    return jsiInterop.evaluateScript("(new $moduleRef.$className()).$functionName($args)")
  }

  fun classProperty(className: String, propertyName: String) =
    jsiInterop.evaluateScript("(new $moduleRef.$className()).$propertyName")

  fun callAsync(functionName: String, args: String = "") = jsiInterop.waitForAsyncFunction(
    methodQueue,
    "$moduleRef.$functionName($args)"
  )

  fun getLastPromiseResult() = global().getProperty("promiseResult")

  fun callClassAsync(className: String, functionName: String? = null, args: String = ""): JavaScriptValue {
    if (functionName == null) {
      return jsiInterop.evaluateScript("new $moduleRef.$className()")
    }

    return jsiInterop.waitForAsyncFunction(methodQueue, "(new $moduleRef.$className()).$functionName($args)")
  }

  fun callViewAsync(viewName: String, functionName: String, args: String = ""): JavaScriptValue {
    return jsiInterop.waitForAsyncFunction(methodQueue, "$moduleRef.$viewName.$functionName($args)")
  }
}

internal inline fun withSingleModule(
  crossinline definition: ModuleDefinitionBuilder.() -> Unit = {},
  numberOfReloads: Int = 1,
  block: SingleTestContext.() -> Unit
) {
  var moduleName = "TestModule"
  withJSIInterop(
    object : Module() {
      override fun definition() = ModuleDefinition {
        Name(moduleName)
        definition()

        name?.let {
          moduleName = it
        }
      }
    },
    numberOfReloads = numberOfReloads,
    block = { methodQueue ->
      val testContext = SingleTestContext(moduleName, this, methodQueue)
      block.invoke(testContext)
    }
  )
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
internal inline fun JSIContext.waitForAsyncFunction(
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
