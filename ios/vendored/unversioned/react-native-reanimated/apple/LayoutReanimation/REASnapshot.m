#import <Foundation/Foundation.h>
#import <RNReanimated/REAScreensHelper.h>
#import <RNReanimated/REASnapshot.h>
#import <React/RCTView.h>
#import <React/UIView+React.h>

NS_ASSUME_NONNULL_BEGIN

@implementation REASnapshot

const int ScreenStackPresentationModal = 1; // RNSScreenStackPresentationModal
const int DEFAULT_MODAL_TOP_OFFSET = 69; // Default iOS modal is shifted from screen top edge by 69px

- (instancetype)init:(REAUIView *)view
{
  self = [super init];
  [self makeSnapshotForView:view useAbsolutePositionOnly:NO];
  return self;
}

- (instancetype)initWithAbsolutePosition:(REAUIView *)view
{
  self = [super init];
  [self makeSnapshotForView:view useAbsolutePositionOnly:YES];
  return self;
}

- (void)makeSnapshotForView:(REAUIView *)view useAbsolutePositionOnly:(BOOL)useAbsolutePositionOnly
{
  REAUIView *mainWindow = UIApplication.sharedApplication.keyWindow;
  CGPoint absolutePosition = [[view superview] convertPoint:view.center toView:nil];
  _values = [NSMutableDictionary new];
#if TARGET_OS_OSX
  _values[@"windowWidth"] = [NSNumber numberWithDouble:mainWindow.frame.size.width];
  _values[@"windowHeight"] = [NSNumber numberWithDouble:mainWindow.frame.size.height];
#else
  _values[@"windowWidth"] = [NSNumber numberWithDouble:mainWindow.bounds.size.width];
  _values[@"windowHeight"] = [NSNumber numberWithDouble:mainWindow.bounds.size.height];
#endif
  _values[@"width"] = [NSNumber numberWithDouble:(double)(view.bounds.size.width)];
  _values[@"height"] = [NSNumber numberWithDouble:(double)(view.bounds.size.height)];
  _values[@"globalOriginX"] = [NSNumber numberWithDouble:absolutePosition.x - view.bounds.size.width / 2.0];
  _values[@"globalOriginY"] = [NSNumber numberWithDouble:absolutePosition.y - view.bounds.size.height / 2.0];
  if (useAbsolutePositionOnly) {
    _values[@"originX"] = _values[@"globalOriginX"];
    _values[@"originY"] = _values[@"globalOriginY"];
    _values[@"originXByParent"] = [NSNumber numberWithDouble:view.center.x - view.bounds.size.width / 2.0];
    _values[@"originYByParent"] = [NSNumber numberWithDouble:view.center.y - view.bounds.size.height / 2.0];

#if TARGET_OS_OSX
    REAUIView *header = nil;
#else
    REAUIView *navigationContainer = view.reactViewController.navigationController.view;
    REAUIView *header = [navigationContainer.subviews count] > 1 ? navigationContainer.subviews[1] : nil;
#endif
    if (header != nil) {
      CGFloat headerHeight = header.frame.size.height;
      CGFloat headerOriginY = header.frame.origin.y;
      REAUIView *screen = [REAScreensHelper getScreenForView:view];
      if ([REAScreensHelper isScreenModal:screen] && screen.superview == nil) {
        int additionalModalOffset = 0;
        REAUIView *screenWrapper = [REAScreensHelper getScreenWrapper:view];
        int screenType = [REAScreensHelper getScreenType:screenWrapper];
        if (screenType == ScreenStackPresentationModal) {
          additionalModalOffset = DEFAULT_MODAL_TOP_OFFSET;
        }
        float originY = [_values[@"originY"] doubleValue] + headerHeight + headerOriginY + additionalModalOffset;
        _values[@"originY"] = @(originY);
      }
      _values[@"headerHeight"] = @(headerHeight);
    } else {
      _values[@"headerHeight"] = @(0);
    }

    REAUIView *transformedView = [self findTransformedView:view];
    if (transformedView != nil) {
      // iOS affine matrix: https://developer.apple.com/documentation/corefoundation/cgaffinetransform
      CGAffineTransform transform = transformedView.transform;
      NSNumber *a = @(transform.a);
      NSNumber *b = @(transform.b);
      NSNumber *c = @(transform.c);
      NSNumber *d = @(transform.d);
      NSNumber *tx = @(transform.tx);
      NSNumber *ty = @(transform.tx);
      _values[@"transformMatrix"] = @[ a, b, @(0), c, d, @(0), tx, ty, @(1) ];
      _values[@"originX"] = @([_values[@"originX"] doubleValue] - [tx doubleValue]);
      _values[@"originY"] = @([_values[@"originY"] doubleValue] - [ty doubleValue]);
    } else {
      // Identity matrix is an default value
      _values[@"transformMatrix"] = @[ @(1), @(0), @(0), @(0), @(1), @(0), @(0), @(0), @(1) ];
    }
#if defined(RCT_NEW_ARCH_ENABLED) || TARGET_OS_TV
    _values[@"borderRadius"] = @(0);
#else
    if ([view respondsToSelector:@selector(borderRadius)]) {
      // For example `RCTTextView` doesn't have `borderRadius` selector
      _values[@"borderRadius"] = @(((RCTView *)view).borderRadius);
    } else {
      _values[@"borderRadius"] = @(0);
    }
#endif
  } else {
    _values[@"originX"] = @(view.center.x - view.bounds.size.width / 2.0);
    _values[@"originY"] = @(view.center.y - view.bounds.size.height / 2.0);
  }
}

- (REAUIView *)findTransformedView:(REAUIView *)view
{
  REAUIView *transformedView;
  bool isTransformed = false;
  do {
    if (transformedView == nil) {
      transformedView = view;
    } else {
      transformedView = transformedView.superview;
    }
    CGAffineTransform transform = transformedView.transform;
    isTransformed = transform.a != 1 || transform.b != 0 || transform.c != 0 || transform.d != 1 || transform.tx != 0 ||
        transform.ty != 0;
  } while (!isTransformed &&
           transformedView != nil
           // Ignore views above screen
           && ![REAScreensHelper isRNSScreenType:transformedView]);

  if (isTransformed && transformedView != nil) {
    return transformedView;
  }
  return nil;
}

@end

NS_ASSUME_NONNULL_END
