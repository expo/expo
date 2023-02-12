package devmenu.com.swmansion.gesturehandler

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
