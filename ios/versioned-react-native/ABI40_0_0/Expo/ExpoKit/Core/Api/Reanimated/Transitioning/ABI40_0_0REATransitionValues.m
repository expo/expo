#import <ABI40_0_0React/ABI40_0_0RCTView.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>

#import "ABI40_0_0REATransition.h"
#import "ABI40_0_0REATransitionValues.h"

@implementation ABI40_0_0REATransitionValues

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root
{
  if (self = [super init]) {
    _view = view;
    _parent = view.superview;
    _ABI40_0_0ReactParent = view.ABI40_0_0ReactSuperview;
    while (_ABI40_0_0ReactParent != nil && _ABI40_0_0ReactParent != root && IS_LAYOUT_ONLY(_ABI40_0_0ReactParent)) {
      _ABI40_0_0ReactParent = _ABI40_0_0ReactParent.ABI40_0_0ReactSuperview;
    }
    _center = view.center;
    _bounds = view.bounds;
    _centerRelativeToRoot = [_parent convertPoint:_center toView:root];
    _centerInABI40_0_0ReactParent = [_parent convertPoint:_center toView:_ABI40_0_0ReactParent];
  }
  return self;
}

@end
