package expo.modules.test.core.legacy

import android.content.Context
import android.os.Bundle
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.modules.Module
import io.mockk.MockK
import io.mockk.MockKGateway
import io.mockk.every
import io.mockk.mockk
import java.lang.ref.WeakReference
import java.lang.reflect.Proxy
import kotlin.reflect.KClass

/**
 * This class shouldn't be used directly. Instead use
 * ```kotlin
 * ModuleMock.createMock(MyModuleTestInterface::class, MyModule()) {
 *   // module test code here
 * }
 * ```
 */
data class ModuleMock<TestInterfaceType : Any, ModuleType : Module>(
  val testInterface: TestInterfaceType,
  val appContext: AppContext,
  val eventEmitter: EventEmitter,
  val moduleSpy: ModuleType
) {
  companion object {
    /**
     * This overload shouldn't be used directly. Instead use
     * the inline overload with `block` being the last argument:
     * `ModuleMock.createMock(..., block: (...) -> Unit)` instead
     */
    fun <TestInterfaceType : Any, ModuleType : Module> createMock(
      moduleTestInterface: KClass<TestInterfaceType>,
      module: ModuleType,
      customAppContext: AppContext? = null,
      customEventEmitter: EventEmitter? = null
    ): ModuleMock<TestInterfaceType, ModuleType> {
      val appContext = prepareMockAppContext(customAppContext)
      val eventEmitter: EventEmitter = customEventEmitter ?: mockk(relaxed = true)

      // prepare module spy
      val moduleSpy = convertToSpy(module, recordPrivateCalls = true)
      every { moduleSpy getProperty "appContext" } returns appContext
      every { moduleSpy.sendEvent(any(), any<Bundle>()) } answers { call ->
        val (eventName, eventBody) = call.invocation.args
        eventEmitter.emit(eventName as String, eventBody as? Bundle)
      }

      val holder = ModuleHolder(moduleSpy)
      val moduleControllerImpl = ModuleControllerImpl(holder)

      val invocationHandler = ModuleMockInvocationHandler(
        moduleTestInterface,
        moduleControllerImpl,
        holder
      )
      @Suppress("UNCHECKED_CAST")
      return ModuleMock(
        Proxy
          .newProxyInstance(
            moduleTestInterface.java.classLoader,
            arrayOf(moduleTestInterface.java, ModuleController::class.java),
            invocationHandler
          ) as TestInterfaceType,
        appContext,
        eventEmitter,
        moduleSpy
      )
    }

    /**
     * Executes the given [block] in the mocked module scope.
     * Example usage:
     * ```kotlin
     * ModuleMock.createMock(MyModuleTestInterface::class, MyModule()) {
     *   every { moduleSpy.someModulePrivateFn() } returns 5
     *   val result = module.someFunctionAsync()
     *   assertEquals(result, 5)
     * }
     * ```
     */
    inline fun <TestInterfaceType : Any, ModuleType : Module> createMock(
      moduleTestInterface: KClass<TestInterfaceType>,
      module: ModuleType,
      autoOnCreate: Boolean = true,
      customAppContext: AppContext? = null,
      customEventEmitter: EventEmitter? = null,
      block: ModuleMockHolder<TestInterfaceType, ModuleType>.() -> Unit
    ) {
      val (mock, appContext, eventEmitter, moduleSpy) = createMock(
        moduleTestInterface,
        module,
        customAppContext,
        customEventEmitter
      )
      val controller = mock as ModuleController
      val holder = ModuleMockHolder<TestInterfaceType, ModuleType>(
        mock,
        controller,
        appContext,
        eventEmitter,
        moduleSpy
      )

      if (autoOnCreate) {
        controller.onCreate()
      }

      block.invoke(holder)
    }
  }
}

private fun prepareMockAppContext(customAppContext: AppContext?): AppContext {
  val reactContext = BridgeReactContext(ApplicationProvider.getApplicationContext<Context>())
  val appContext = customAppContext ?: AppContext(
    modulesProvider = mockk(relaxed = true),
    legacyModuleRegistry = mockk(relaxed = true),
    reactContextHolder = WeakReference(reactContext)
  )

  // as AppContext holds only weak reference to Android Context which can be destroyed too early
  // we need to override it to return actual strong reference (held by mockk internals)
  val appContextSpy = convertToSpy(appContext)
  every { appContextSpy getProperty "reactContext" } returns reactContext
  every { appContextSpy getProperty "hasActiveReactInstance" } returns true
  return appContextSpy
}

/**
 * Creates a spy from a given object or returns it as-is if it's already a spy
 */
private fun <T : Any> convertToSpy(obj: T, recordPrivateCalls: Boolean = false): T =
  MockK.useImpl {
    return@useImpl if (MockKGateway.implementation().mockTypeChecker.isSpy(obj)) {
      obj
    } else {
      // this is actually spyk<T>(obj) but without syntax sugar
      // because we're already inside MockK.useImpl { } which is part of that sugar
      MockKGateway.implementation().mockFactory.spyk(
        mockType = null, // this should be null if objToCopy is provided
        objToCopy = obj,
        name = null,
        moreInterfaces = emptyArray(),
        recordPrivateCalls = recordPrivateCalls
      )
    }
  }
