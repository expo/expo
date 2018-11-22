package abi30_0_0.host.exp.exponent.modules.api.components.gesturehandler;

public interface GestureHandlerInteractionController {
  boolean shouldWaitForHandlerFailure(GestureHandler handler, GestureHandler otherHandler);
  boolean shouldRequireHandlerToWaitForFailure(GestureHandler handler, GestureHandler otherHandler);
  boolean shouldRecognizeSimultaneously(GestureHandler handler, GestureHandler otherHandler);
  boolean shouldHandlerBeCancelledBy(GestureHandler handler, GestureHandler otherHandler);
}
