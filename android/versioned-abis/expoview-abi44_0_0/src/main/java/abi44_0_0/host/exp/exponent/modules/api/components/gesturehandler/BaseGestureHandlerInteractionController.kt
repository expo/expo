package abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler

abstract class BaseGestureHandlerInteractionController : GestureHandlerInteractionController {
  override fun shouldWaitForHandlerFailure(
    handler: GestureHandler<*>,
    otherHandler: GestureHandler<*>,
  ) = false

  override fun shouldRequireHandlerToWaitForFailure(
    handler: GestureHandler<*>,
    otherHandler: GestureHandler<*>,
  ) = false

  override fun shouldRecognizeSimultaneously(
    handler: GestureHandler<*>,
    otherHandler: GestureHandler<*>,
  ) = false
}
