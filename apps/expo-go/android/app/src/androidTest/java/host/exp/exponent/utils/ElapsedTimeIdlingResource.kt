// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import androidx.test.espresso.IdlingResource

class ElapsedTimeIdlingResource : IdlingResource {
  private var startTime: Long = 0
  private var waitingTime: Long = 0
  private var resourceCallback: IdlingResource.ResourceCallback? = null
  private var isSleeping = false

  fun sleep(waitingTime: Long) {
    this.waitingTime = waitingTime
    startTime = System.currentTimeMillis()
    isSleeping = true
  }

  override fun getName(): String {
    return ElapsedTimeIdlingResource::class.java.name + ":" + waitingTime
  }

  override fun isIdleNow(): Boolean {
    if (!isSleeping) {
      return true
    }
    val elapsed = System.currentTimeMillis() - startTime
    val idle = elapsed >= waitingTime
    if (idle) {
      isSleeping = false
      resourceCallback!!.onTransitionToIdle()
    }
    return idle
  }

  override fun registerIdleTransitionCallback(resourceCallback: IdlingResource.ResourceCallback) {
    this.resourceCallback = resourceCallback
  }
}
