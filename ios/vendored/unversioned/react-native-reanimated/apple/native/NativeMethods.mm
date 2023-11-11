#import <RNReanimated/NativeMethods.h>
#import <RNReanimated/REAUIKit.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTScrollView.h>

namespace reanimated {

std::vector<std::pair<std::string, double>> measure(int viewTag, RCTUIManager *uiManager)
{
  REAUIView *view = [uiManager viewForReactTag:@(viewTag)];

  REAUIView *rootView = view;

  if (view == nil) {
    return std::vector<std::pair<std::string, double>>(1, std::make_pair("x", -1234567.0));
  }

  while (rootView.superview && ![rootView isReactRootView]) {
    rootView = rootView.superview;
  }

  if (rootView == nil) {
    return std::vector<std::pair<std::string, double>>(1, std::make_pair("x", -1234567.0));
  }

  CGRect frame = view.frame;
  CGRect globalBounds = [view convertRect:view.bounds toView:rootView];

  return {
      {"x", frame.origin.x},
      {"y", frame.origin.y},
      {"width", globalBounds.size.width},
      {"height", globalBounds.size.height},
      {"pageX", globalBounds.origin.x},
      {"pageY", globalBounds.origin.y},
  };
}

void scrollTo(int scrollViewTag, RCTUIManager *uiManager, double x, double y, bool animated)
{
  REAUIView *view = [uiManager viewForReactTag:@(scrollViewTag)];
  RCTScrollView *scrollView = (RCTScrollView *)view;
  [scrollView scrollToOffset:(CGPoint){(CGFloat)x, (CGFloat)y} animated:animated];
}

void setGestureState(id<RNGestureHandlerStateManager> gestureHandlerStateManager, int handlerTag, int newState)
{
  if (gestureHandlerStateManager != nil) {
    [gestureHandlerStateManager setGestureState:newState forHandler:handlerTag];
  }
}

} // namespace reanimated
