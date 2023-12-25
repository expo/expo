// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import androidx.test.espresso.IdlingResource
import de.greenrobot.event.EventBus
import host.exp.exponent.test.TestCompletedEvent
import host.exp.exponent.test.TestResolvePromiseEvent

class JSTestRunnerIdlingResource : IdlingResource {
  private var hasCompleted = false
  private var resourceCallback: IdlingResource.ResourceCallback? = null
  var testResult: String? = null
    private set

  fun onEvent(event: TestCompletedEvent) {
    hasCompleted = true
    testResult = event.result
    resourceCallback?.onTransitionToIdle()
    EventBus.getDefault().post(TestResolvePromiseEvent(event.id))
  }

  override fun getName(): String {
    return JSTestRunnerIdlingResource::class.java.name
  }

  override fun isIdleNow(): Boolean {
    return hasCompleted
  }

  override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback) {
    resourceCallback = callback
  }

  init {
    EventBus.getDefault().register(this)
  }
}
