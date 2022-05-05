package expo.modules.test.core

import android.content.Context
import android.os.Bundle
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.modules.Module
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import java.lang.ref.WeakReference
import java.lang.reflect.Proxy
import kotlin.reflect.KClass

class ModuleMock {
  companion object {
    fun <T : Any> createMock(
      moduleTestInterface: KClass<T>,
      module: Module,
      customAppContext: AppContext? = null,
      customEventEmitter: EventEmitter? = null,
    ): Triple<T, AppContext, EventEmitter> {
      val appContext = prepareMockAppContext(customAppContext)
      val eventEmitter: EventEmitter = customEventEmitter ?: mockk(relaxed = true)

      // prepare module spy
      val moduleSpy = spyk(module)
      every { moduleSpy getProperty "appContext" } returns appContext
      every { moduleSpy.sendEvent(any(), any()) } answers { call ->
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
      return Triple(
        Proxy
          .newProxyInstance(
            moduleTestInterface.java.classLoader,
            arrayOf(moduleTestInterface.java, ModuleController::class.java),
            invocationHandler
          ) as T,
        appContext,
        eventEmitter
      )
    }

    inline fun <T : Any> createMock(
      moduleTestInterface: KClass<T>,
      module: Module,
      autoOnCreate: Boolean = true,
      customAppContext: AppContext? = null,
      customEventEmitter: EventEmitter? = null,
      block: ModuleMockHolder<T>.() -> Unit
    ) {
      val (mock, appContext, eventEmitter) = createMock(
        moduleTestInterface,
        module,
        customAppContext,
        customEventEmitter
      )
      val controller = mock as ModuleController
      val holder = ModuleMockHolder<T>(mock, controller, appContext, eventEmitter)

      if (autoOnCreate) {
        controller.onCreate()
      }

      block.invoke(holder)
    }
  }
}

private fun prepareMockAppContext(customAppContext: AppContext?): AppContext {
  val reactContext = ReactApplicationContext(ApplicationProvider.getApplicationContext<Context>())
  val appContext = customAppContext ?: AppContext(
    modulesProvider = mockk(relaxed = true),
    legacyModuleRegistry = mockk(relaxed = true),
    reactContextHolder = WeakReference(reactContext)
  )

  // as AppContext holds only weak reference to Android Context which can be destroyed too early
  // we need to override it to return actual strong reference (held by mockk internals)
  val appContextSpy = spyk(appContext)
  every { appContextSpy getProperty "reactContext" } returns reactContext

  return appContextSpy
}
