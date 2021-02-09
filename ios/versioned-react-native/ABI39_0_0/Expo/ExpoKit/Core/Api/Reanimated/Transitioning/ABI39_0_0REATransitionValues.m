#import <ABI39_0_0React/ABI39_0_0RCTView.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>

#import "ABI39_0_0REATransition.h"
#import "ABI39_0_0REATransitionValues.h"

@implementation ABI39_0_0REATransitionValues

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root
{
  if (self = [super init]) {
    _view = view;
    _parent = view.superview;
    _ABI39_0_0ReactParent = view.ABI39_0_0ReactSuperview;
    while (_ABI39_0_0ReactParent != nil && _ABI39_0_0ReactParent != root && IS_LAYOUT_ONLY(_ABI39_0_0ReactParent)) {
      _ABI39_0_0ReactParent = _ABI39_0_0ReactParent.ABI39_0_0ReactSuperview;
    }
    _center = view.center;
    _bounds = view.bounds;
    _centerRelativeToRoot = [_parent convertPoint:_center toView:root];
    _centerInABI39_0_0ReactParent = [_parent convertPoint:_center toView:_ABI39_0_0ReactParent];
  }
  return self;
}

@end
