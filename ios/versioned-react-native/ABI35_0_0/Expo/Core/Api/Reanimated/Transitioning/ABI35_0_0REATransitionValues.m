#import <ReactABI35_0_0/ABI35_0_0RCTView.h>
#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>

#import "ABI35_0_0REATransition.h"
#import "ABI35_0_0REATransitionValues.h"

@implementation ABI35_0_0REATransitionValues

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root
{
  if (self = [super init]) {
    _view = view;
    _parent = view.superview;
    _ReactABI35_0_0Parent = view.ReactABI35_0_0Superview;
    while (_ReactABI35_0_0Parent != nil && _ReactABI35_0_0Parent != root && IS_LAYOUT_ONLY(_ReactABI35_0_0Parent)) {
      _ReactABI35_0_0Parent = _ReactABI35_0_0Parent.ReactABI35_0_0Superview;
    }
    _center = view.center;
    _bounds = view.bounds;
    _centerRelativeToRoot = [_parent convertPoint:_center toView:root];
    _centerInReactABI35_0_0Parent = [_parent convertPoint:_center toView:_ReactABI35_0_0Parent];
  }
  return self;
}

@end
