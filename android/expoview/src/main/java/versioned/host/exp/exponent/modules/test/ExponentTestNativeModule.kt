// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent.modules.test

import com.facebook.react.bridge.*
import de.greenrobot.event.EventBus
import host.exp.exponent.test.TestResolvePromiseEvent
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.kernel.KernelConfig
import host.exp.exponent.test.TestActionEvent
import host.exp.exponent.test.TestCompletedEvent
import org.json.JSONObject

class ExponentTestNativeModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "ExponentTest"
  }

  private var currentId = 0
  private val idToPromiseMap = mutableMapOf<Int, Promise>()

  private fun getPromiseId(promise: Promise): Int {
    val id = currentId++
    idToPromiseMap[id] = promise
    return id
  }

  fun onEvent(event: TestResolvePromiseEvent) {
    if (idToPromiseMap.containsKey(event.id)) {
      idToPromiseMap[event.id]!!.resolve(true)
      idToPromiseMap.remove(event.id)
    }
  }

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "isInCI" to try {
        val config = JSONObject(ExponentBuildConstants.TEST_CONFIG)
        config.has("isInCI")
      } catch (e: Throwable) {
        false
      }
    )
  }

  @ReactMethod
  fun action(options: ReadableMap, promise: Promise) {
    if (!KernelConfig.IS_TEST) {
      promise.resolve(true)
    }

    val selectorType = options.getString("selectorType")
    var selectorValue: String? = null
    if (options.hasKey("selectorValue")) {
      selectorValue = options.getString("selectorValue")
    }

    val actionType = options.getString("actionType")
    var actionValue: String? = null
    if (options.hasKey("actionValue")) {
      actionValue = options.getString("actionValue")
    }

    var timeout = 0
    if (options.hasKey("timeout")) {
      timeout = options.getInt("timeout")
    }

    var delay = 0
    if (options.hasKey("delay")) {
      delay = options.getInt("delay")
    }

    EventBus.getDefault().post(
      TestActionEvent(
        getPromiseId(promise),
        selectorType,
        selectorValue,
        actionType,
        actionValue,
        delay,
        timeout
      )
    )
  }

  @ReactMethod
  fun completed(stringifiedJson: String, promise: Promise) {
    if (!KernelConfig.IS_TEST) {
      promise.resolve(true)
    }
    EventBus.getDefault().post(TestCompletedEvent(getPromiseId(promise), stringifiedJson))
  }

  companion object {
    private val TAG = ExponentTestNativeModule::class.java.simpleName
  }

  init {
    EventBus.getDefault().register(this)
  }
}
