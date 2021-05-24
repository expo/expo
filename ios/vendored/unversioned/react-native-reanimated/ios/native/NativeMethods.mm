#import "NativeMethods.h"
#import <React/RCTScrollView.h>
#import <React/RCTEventDispatcher.h>

namespace reanimated {

std::vector<std::pair<std::string,double>> measure(int viewTag, RCTUIManager *uiManager) {
  UIView *view = [uiManager viewForReactTag:@(viewTag)];

  UIView *rootView = view;

  if (view == nil) {
    return std::vector<std::pair<std::string, double>>(0, std::make_pair("x", -1234567.0));
  }

  while (rootView.superview && ![rootView isReactRootView]) {
    rootView = rootView.superview;
  }

  if (rootView == nil || (![rootView isReactRootView])) {
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


void scrollTo(int scrollViewTag, RCTUIManager *uiManager, double x, double y, bool animated) {
  UIView *view = [uiManager viewForReactTag:@(scrollViewTag)];
  RCTScrollView *scrollView = (RCTScrollView *) view;
  [scrollView scrollToOffset:(CGPoint){(CGFloat)x, (CGFloat)y} animated:animated];
}

}
