#import <Foundation/Foundation.h>
#import <RNReanimated/REASnapshot.h>

NS_ASSUME_NONNULL_BEGIN

@implementation REASnapshot {
  UIView *_view;
}

- (instancetype)init:(UIView *)view
{
  self = [super init];
  _view = view;
  UIView *windowView = UIApplication.sharedApplication.keyWindow;
  CGPoint originFromRootPerspective = [[view superview] convertPoint:view.center toView:windowView];
  _values = [NSMutableDictionary new];
  _values[@"width"] = [NSNumber numberWithDouble:(double)(view.bounds.size.width)];
  _values[@"height"] = [NSNumber numberWithDouble:(double)(view.bounds.size.height)];
  _values[@"originX"] = [NSNumber numberWithDouble:view.center.x - view.bounds.size.width / 2.0];
  _values[@"originY"] = [NSNumber numberWithDouble:view.center.y - view.bounds.size.height / 2.0];
  _values[@"globalOriginX"] = [NSNumber numberWithDouble:originFromRootPerspective.x - view.bounds.size.width / 2.0];
  _values[@"globalOriginY"] = [NSNumber numberWithDouble:originFromRootPerspective.y - view.bounds.size.height / 2.0];

  return self;
}

@end

NS_ASSUME_NONNULL_END
