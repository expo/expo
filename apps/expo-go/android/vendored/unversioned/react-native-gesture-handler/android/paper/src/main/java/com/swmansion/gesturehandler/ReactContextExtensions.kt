package com.swmansion.gesturehandler

import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.Event

fun ReactContext.dispatchEvent(event: Event<*>) {
  try {
    this.getNativeModule(UIManagerModule::class.java)!!.eventDispatcher.dispatchEvent(event)
  } catch (e: NullPointerException) {
    throw Exception("Couldn't get an instance of UIManagerModule. Gesture Handler is unable to send an event.", e)
  }
}
