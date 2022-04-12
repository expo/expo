#import <RNReanimated/REATransition.h>
#import <RNReanimated/REATransitionValues.h>
#import <React/RCTView.h>
#import <React/RCTViewManager.h>

@implementation REATransitionValues

- (instancetype)initWithView:(UIView *)view forRoot:(UIView *)root
{
  if (self = [super init]) {
    _view = view;
    _parent = view.superview;
    _reactParent = view.reactSuperview;
    while (_reactParent != nil && _reactParent != root && IS_LAYOUT_ONLY(_reactParent)) {
      _reactParent = _reactParent.reactSuperview;
    }
    _center = view.center;
    _bounds = view.bounds;
    _centerRelativeToRoot = [_parent convertPoint:_center toView:root];
    _centerInReactParent = [_parent convertPoint:_center toView:_reactParent];
  }
  return self;
}

@end
