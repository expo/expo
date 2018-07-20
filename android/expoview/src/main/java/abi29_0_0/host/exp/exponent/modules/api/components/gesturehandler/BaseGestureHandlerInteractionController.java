package abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler;

public abstract class BaseGestureHandlerInteractionController
        implements GestureHandlerInteractionController {

  @Override
  public boolean shouldWaitForHandlerFailure(GestureHandler handler,
                                             GestureHandler otherHandler) {
    return false;
  }

  @Override
  public boolean shouldRequireHandlerToWaitForFailure(GestureHandler handler,
                                                      GestureHandler otherHandler) {
    return false;
  }

  @Override
  public boolean shouldRecognizeSimultaneously(GestureHandler handler,
                                               GestureHandler otherHandler) {
    return false;
  }
}
