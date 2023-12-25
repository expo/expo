package com.swmansion.gesturehandler.core

interface GestureHandlerInteractionController {
  fun shouldWaitForHandlerFailure(handler: GestureHandler<*>, otherHandler: GestureHandler<*>): Boolean
  fun shouldRequireHandlerToWaitForFailure(handler: GestureHandler<*>, otherHandler: GestureHandler<*>): Boolean
  fun shouldRecognizeSimultaneously(handler: GestureHandler<*>, otherHandler: GestureHandler<*>): Boolean
  fun shouldHandlerBeCancelledBy(handler: GestureHandler<*>, otherHandler: GestureHandler<*>): Boolean
}
