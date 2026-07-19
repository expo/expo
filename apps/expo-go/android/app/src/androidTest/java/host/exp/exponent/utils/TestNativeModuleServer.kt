// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.os.Handler
import android.util.Log
import androidx.test.uiautomator.Configurator
import androidx.test.uiautomator.UiDevice
import host.exp.exponent.test.TestActionEvent
import androidx.test.uiautomator.UiSelector
import androidx.test.uiautomator.UiObject
import de.greenrobot.event.EventBus
import host.exp.exponent.test.TestResolvePromiseEvent
import java.lang.Exception
import java.lang.RuntimeException

class TestNativeModuleServer private constructor() {
  var uiDevice: UiDevice? = null

  fun onEvent(event: TestActionEvent) {
    if (event.delay <= 0) {
      performAction(event)
    } else {
      Handler().postDelayed({ performAction(event) }, event.delay.toLong())
    }
  }

  private fun performAction(event: TestActionEvent) {
    synchronized(this) {
      try {
        Configurator.getInstance().waitForSelectorTimeout = event.timeout.toLong()
        val selector = getSelectorForObject(event)
        val obj = uiDevice!!.findObject(selector)
        runActionOnObject(event, obj)
      } catch (e: Throwable) {
        Log.d(TAG, "Error in performAction: $e")
      } finally {
        EventBus.getDefault().post(TestResolvePromiseEvent(event.id))
      }
    }
  }

  private fun getSelectorForObject(event: TestActionEvent): UiSelector {
    return when (event.selectorType) {
      "text" -> UiSelector().text(event.selectorValue)
      else -> throw RuntimeException("No selector found for type " + event.selectorType)
    }
  }

  private fun runActionOnObject(event: TestActionEvent, `object`: UiObject) {
    try {
      when (event.actionType) {
        "click" -> `object`.click()
        else -> throw RuntimeException("No action found for type " + event.actionType)
      }
    } catch (e: Exception) {
      throw RuntimeException(e.toString())
    }
  }

  companion object {
    private val TAG = TestNativeModuleServer::class.java.simpleName

    @JvmStatic val instance: TestNativeModuleServer by lazy {
      TestNativeModuleServer()
    }
  }

  init {
    EventBus.getDefault().register(this)
  }
}
