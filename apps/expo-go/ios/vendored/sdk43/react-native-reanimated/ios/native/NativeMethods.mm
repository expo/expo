#import "NativeMethods.h"
#import <ABI43_0_0React/ABI43_0_0RCTScrollView.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcher.h>

namespace ABI43_0_0reanimated {

std::vector<std::pair<std::string,double>> measure(int viewTag, ABI43_0_0RCTUIManager *uiManager) {
  UIView *view = [uiManager viewForABI43_0_0ReactTag:@(viewTag)];

  UIView *rootView = view;

  if (view == nil) {
    return std::vector<std::pair<std::string, double>>(1, std::make_pair("x", -1234567.0));
  }

  while (rootView.superview && ![rootView isABI43_0_0ReactRootView]) {
    rootView = rootView.superview;
  }

  if (rootView == nil || (![rootView isABI43_0_0ReactRootView])) {
    return std::vector<std::pair<std::string, double>>(1, std::make_pair("x", -1234567.0));
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


void scrollTo(int scrollViewTag, ABI43_0_0RCTUIManager *uiManager, double x, double y, bool animated) {
  UIView *view = [uiManager viewForABI43_0_0ReactTag:@(scrollViewTag)];
  ABI43_0_0RCTScrollView *scrollView = (ABI43_0_0RCTScrollView *) view;
  [scrollView scrollToOffset:(CGPoint){(CGFloat)x, (CGFloat)y} animated:animated];
}

}
