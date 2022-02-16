package expo.modules.test.core

import android.content.Context
import android.os.Bundle
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.toJSMap
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import java.lang.IllegalArgumentException
import java.lang.ref.WeakReference

class ModuleMock<T : Module>(
  module: T,
  autoOnCreate: Boolean = false
) {
  private val moduleHolder: ModuleHolder
  val eventEmitter: EventEmitter = mockk(relaxed = true)

  init {
    val context = ReactApplicationContext(ApplicationProvider.getApplicationContext())
    val appContext = spyk(
      AppContext(
        modulesProvider = mockk(relaxed = true),
        legacyModuleRegistry = mockk(relaxed = true),
        reactContextHolder = WeakReference(context)
      )
    )

    // NOTE (barthap): This initialization is often called in @Before method
    // and Context sometimes isn't initialized yet. This workaround
    // loads current context every time it is accessed
    // TODO: Find a better solution for this
    every { appContext getProperty "reactContext" } answers {
      ReactApplicationContext(ApplicationProvider.getApplicationContext())
    }

    val moduleSpy = spyk<Module>(module)
    every { moduleSpy getProperty "appContext" } returns appContext
    every { moduleSpy.sendEvent(any(), any()) } answers { call ->
      val (eventName, eventBody) = call.invocation.args
      eventEmitter.emit(eventName as String, eventBody as? Bundle)
    }
    moduleHolder = ModuleHolder(moduleSpy)

    if (autoOnCreate) {
      callOnCreate()
    }
  }

  fun callOnCreate() {
    moduleHolder.post(EventName.MODULE_CREATE)
  }

  fun activityGoesBackground() {
    moduleHolder.post(EventName.ACTIVITY_ENTERS_BACKGROUND)
  }

  fun activityGoesForeground() {
    moduleHolder.post(EventName.ACTIVITY_ENTERS_FOREGROUND)
  }

  fun callFunction(name: String, vararg args: Any?): PromiseMock {
    val promise = PromiseMock()

    val arguments = convertArgs(args.asIterable())
    moduleHolder.call(name, arguments, promise)

    return promise
  }

  // TODO: Maybe use some existing type conversion, add more sophisticated conversion method
  private fun convertArgs(args: Iterable<Any?>): ReadableArray {
    val argsList = JavaOnlyArray()

    for (arg in args) {
      when (arg) {
        null -> argsList.pushNull()
        is Int -> argsList.pushInt(arg)
        is Number -> argsList.pushDouble(arg.toDouble())
        is Boolean -> argsList.pushBoolean(arg)
        is String -> argsList.pushString(arg)
        is Record -> argsList.pushMap(arg.toJSMap())
        is Iterable<*> -> argsList.pushArray(convertArgs(arg))
        else -> throw IllegalArgumentException("Unsupported argument type ${arg.javaClass} in ModuleMock")
      }
    }

    return argsList
  }
}
