package abi48_0_0.com.swmansion.gesturehandler

import abi48_0_0.com.facebook.react.bridge.ReactContext
import abi48_0_0.com.facebook.react.fabric.FabricUIManager
import abi48_0_0.com.facebook.react.uimanager.UIManagerHelper
import abi48_0_0.com.facebook.react.uimanager.common.UIManagerType
import abi48_0_0.com.facebook.react.uimanager.events.Event

fun ReactContext.dispatchEvent(event: Event<*>) {
  val fabricUIManager = UIManagerHelper.getUIManager(this, UIManagerType.FABRIC) as FabricUIManager
  fabricUIManager.eventDispatcher.dispatchEvent(event)
}
