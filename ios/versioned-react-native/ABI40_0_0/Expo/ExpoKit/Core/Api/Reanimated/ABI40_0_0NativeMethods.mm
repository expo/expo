#import "ABI40_0_0NativeMethods.h"
#import <ABI40_0_0React/ABI40_0_0RCTScrollView.h>


namespace ABI40_0_0reanimated {

std::vector<std::pair<std::string,double>> measure(int viewTag, ABI40_0_0RCTUIManager *uiManager) {
  UIView *view = [uiManager viewForABI40_0_0ReactTag:@(viewTag)];
 
  UIView *rootView = view;
  
  if (view == nil) {
    return std::vector<std::pair<std::string, double>>(0, std::make_pair("x", -1234567.0));
  }
  
  while (rootView.superview && ![rootView isABI40_0_0ReactRootView]) {
    rootView = rootView.superview;
  }
  
  if (rootView == nil || (![rootView isABI40_0_0ReactRootView])) {
    return std::vector<std::pair<std::string, double>>(0, std::make_pair("x", -1234567.0));
  }

  CGRect frame = view.frame;
  CGRect globalBounds = [view convertRect:view.bounds toView:rootView];

  std::vector<std::pair<std::string, double>> result;
  result.push_back({"x", frame.origin.x});
  result.push_back({"y", frame.origin.y});
  
  result.push_back({"width", globalBounds.size.width});
  result.push_back({"height", globalBounds.size.height});
  
  result.push_back({"pageX", globalBounds.origin.x});
  result.push_back({"pageY", globalBounds.origin.y});
  return result;
}


NSString *eventDispatcherKey = @"eventDispatcher";
void scrollTo(int scrollViewTag, ABI40_0_0RCTUIManager *uiManager, double x, double y, bool animated) {
  UIView *view = [uiManager viewForABI40_0_0ReactTag:@(scrollViewTag)];
  ABI40_0_0RCTScrollView *scrollView = (ABI40_0_0RCTScrollView *) view;
  ABI40_0_0RCTEventDispatcher* oldEventDispatcher = [scrollView valueForKey:eventDispatcherKey];
  [scrollView setValue:nil forKey:eventDispatcherKey];
  [scrollView scrollToOffset:(CGPoint){(CGFloat)x, (CGFloat)y} animated:animated];
  [scrollView setValue:oldEventDispatcher forKey:eventDispatcherKey];
}

}
