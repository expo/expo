package abi47_0_0.com.swmansion.gesturehandler

import abi47_0_0.com.facebook.react.bridge.ReactContext
import abi47_0_0.com.facebook.react.uimanager.UIManagerModule
import abi47_0_0.com.facebook.react.uimanager.events.Event

fun ReactContext.dispatchEvent(event: Event<*>) {
  try {
    this.getNativeModule(UIManagerModule::class.java)!!.eventDispatcher.dispatchEvent(event)
  } catch (e: NullPointerException) {
    throw Exception("Couldn't get an instance of UIManagerModule. Gesture Handler is unable to send an event.", e)
  }
}
