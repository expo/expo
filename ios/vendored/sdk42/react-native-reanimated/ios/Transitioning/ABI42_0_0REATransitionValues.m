#import <ABI42_0_0React/ABI42_0_0RCTView.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>

#import "ABI42_0_0REATransition.h"
#import "ABI42_0_0REATransitionValues.h"

@implementation ABI42_0_0REATransitionValues

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root
{
  if (self = [super init]) {
    _view = view;
    _parent = view.superview;
    _reactParent = view.ABI42_0_0ReactSuperview;
    while (_reactParent != nil && _reactParent != root && IS_LAYOUT_ONLY(_reactParent)) {
      _reactParent = _reactParent.ABI42_0_0ReactSuperview;
    }
    _center = view.center;
    _bounds = view.bounds;
    _centerRelativeToRoot = [_parent convertPoint:_center toView:root];
    _centerInReactParent = [_parent convertPoint:_center toView:_reactParent];
  }
  return self;
}

@end
