#import <ABI38_0_0React/ABI38_0_0RCTView.h>
#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>

#import "ABI38_0_0REATransition.h"
#import "ABI38_0_0REATransitionValues.h"

@implementation ABI38_0_0REATransitionValues

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root
{
  if (self = [super init]) {
    _view = view;
    _parent = view.superview;
    _ABI38_0_0ReactParent = view.ABI38_0_0ReactSuperview;
    while (_ABI38_0_0ReactParent != nil && _ABI38_0_0ReactParent != root && IS_LAYOUT_ONLY(_ABI38_0_0ReactParent)) {
      _ABI38_0_0ReactParent = _ABI38_0_0ReactParent.ABI38_0_0ReactSuperview;
    }
    _center = view.center;
    _bounds = view.bounds;
    _centerRelativeToRoot = [_parent convertPoint:_center toView:root];
    _centerInABI38_0_0ReactParent = [_parent convertPoint:_center toView:_ABI38_0_0ReactParent];
  }
  return self;
}

@end
