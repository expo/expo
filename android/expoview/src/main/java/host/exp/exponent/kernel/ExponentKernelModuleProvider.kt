// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.util.*

object ExponentKernelModuleProvider {
  private var factory: ExponentKernelModuleFactory = object : ExponentKernelModuleFactory {
    override fun create(reactContext: ReactApplicationContext): ExponentKernelModuleInterface {
      return ExpoViewKernelModule(reactContext)
    }
  }

  private var instance: ExponentKernelModuleInterface? = null

  @JvmStatic fun setFactory(factory: ExponentKernelModuleFactory) {
    this.factory = factory
  }

  @JvmStatic fun newInstance(reactContext: ReactApplicationContext): ExponentKernelModuleInterface? {
    instance = factory.create(reactContext)
    return instance
  }

  @JvmStatic var eventQueue: Queue<KernelEvent> = LinkedList()
  fun queueEvent(name: String, data: WritableMap, callback: KernelEventCallback) {
    queueEvent(KernelEvent(name, data, callback))
  }

  fun queueEvent(event: KernelEvent) {
    eventQueue.add(event)
    instance?.consumeEventQueue()
  }

  interface KernelEventCallback {
    fun onEventSuccess(result: ReadableMap)
    fun onEventFailure(errorMessage: String?)
  }

  interface ExponentKernelModuleFactory {
    fun create(reactContext: ReactApplicationContext): ExponentKernelModuleInterface
  }

  data class KernelEvent(val name: String, val data: WritableMap, val callback: KernelEventCallback)
}
