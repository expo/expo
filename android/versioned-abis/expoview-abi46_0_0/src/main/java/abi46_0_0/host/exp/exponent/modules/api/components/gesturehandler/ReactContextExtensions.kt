package abi46_0_0.host.exp.exponent.modules.api.components.gesturehandler

import abi46_0_0.com.facebook.react.bridge.ReactContext
import abi46_0_0.com.facebook.react.uimanager.UIManagerModule
import abi46_0_0.com.facebook.react.uimanager.events.Event

fun ReactContext.dispatchEvent(event: Event<*>) {
  try {
    this.getNativeModule(UIManagerModule::class.java)!!.eventDispatcher.dispatchEvent(event)
  } catch (e: NullPointerException) {
    throw Exception("Couldn't get an instance of UIManagerModule. Gesture Handler is unable to send an event.", e)
  }
}
