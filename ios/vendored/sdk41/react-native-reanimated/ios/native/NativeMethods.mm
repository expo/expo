#import "NativeMethods.h"
#import <ABI41_0_0React/ABI41_0_0RCTScrollView.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>

namespace ABI41_0_0reanimated {

std::vector<std::pair<std::string,double>> measure(int viewTag, ABI41_0_0RCTUIManager *uiManager) {
  UIView *view = [uiManager viewForABI41_0_0ReactTag:@(viewTag)];

  UIView *rootView = view;

  if (view == nil) {
    return std::vector<std::pair<std::string, double>>(0, std::make_pair("x", -1234567.0));
  }

  while (rootView.superview && ![rootView isABI41_0_0ReactRootView]) {
    rootView = rootView.superview;
  }

  if (rootView == nil || (![rootView isABI41_0_0ReactRootView])) {
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


void scrollTo(int scrollViewTag, ABI41_0_0RCTUIManager *uiManager, double x, double y, bool animated) {
  UIView *view = [uiManager viewForABI41_0_0ReactTag:@(scrollViewTag)];
  ABI41_0_0RCTScrollView *scrollView = (ABI41_0_0RCTScrollView *) view;
  [scrollView scrollToOffset:(CGPoint){(CGFloat)x, (CGFloat)y} animated:animated];
}

}
