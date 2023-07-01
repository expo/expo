#import <UIKit/UIKit.h>

#import "ABI49_0_0RNSFullWindowOverlay.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceTouchHandler.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/ABI49_0_0RCTComponentViewHelpers.h>
#else
#import <ABI49_0_0React/ABI49_0_0RCTTouchHandler.h>
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@implementation ABI49_0_0RNSFullWindowOverlayContainer

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  for (UIView *view in [self subviews]) {
    if (view.userInteractionEnabled && [view pointInside:[self convertPoint:point toView:view] withEvent:event]) {
      return YES;
    }
  }
  return NO;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if (!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  UIView *hitSubview = nil;
  BOOL isPointInside = [self pointInside:point withEvent:event];
  if (![self clipsToBounds] || isPointInside) {
    // Take z-index into account when calculating the touch target.
    NSArray<UIView *> *sortedSubviews = [self ABI49_0_0ReactZIndexSortedSubviews];

    // The default behaviour of UIKit is that if a view does not contain a point,
    // then no subviews will be returned from hit testing, even if they contain
    // the hit point. By doing hit testing directly on the subviews, we bypass
    // the strict containment policy (i.e., UIKit guarantees that every ancestor
    // of the hit view will return YES from -pointInside:withEvent:). See:
    //  - https://developer.apple.com/library/ios/qa/qa2013/qa1812.html
    for (UIView *subview in [sortedSubviews reverseObjectEnumerator]) {
      CGPoint convertedPoint = [subview convertPoint:point fromView:self];
      hitSubview = [subview hitTest:convertedPoint withEvent:event];
      if (hitSubview != nil) {
        break;
      }
    }
  }
  return hitSubview;
}

@end

@implementation ABI49_0_0RNSFullWindowOverlay {
  __weak ABI49_0_0RCTBridge *_bridge;
  ABI49_0_0RNSFullWindowOverlayContainer *_container;
  CGRect _reactFrame;
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  ABI49_0_0RCTSurfaceTouchHandler *_touchHandler;
#else
  ABI49_0_0RCTTouchHandler *_touchHandler;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (instancetype)init
{
  if (self = [super init]) {
    static const auto defaultProps = std::make_shared<const ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSFullWindowOverlayProps>();
    _props = defaultProps;
    [self _initCommon];
  }
  return self;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    [self _initCommon];
  }

  return self;
}

- (void)_initCommon
{
  _reactFrame = CGRectNull;
  _container = self.container;
  [self show];
}

- (void)addSubview:(UIView *)view
{
  [_container addSubview:view];
}

- (ABI49_0_0RNSFullWindowOverlayContainer *)container
{
  if (_container == nil) {
    _container = [[ABI49_0_0RNSFullWindowOverlayContainer alloc] initWithFrame:_reactFrame];
  }

  return _container;
}

- (void)show
{
  UIWindow *window = ABI49_0_0RCTSharedApplication().delegate.window;
  [window addSubview:_container];
}

- (void)didMoveToWindow
{
  if (self.window == nil) {
    if (_container != nil) {
      [_container removeFromSuperview];
      [_touchHandler detachFromView:_container];
    }
  } else {
    if (_touchHandler == nil) {
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
      _touchHandler = [ABI49_0_0RCTSurfaceTouchHandler new];
#else
      _touchHandler = [[ABI49_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
#endif
    }
    [_touchHandler attachToView:_container];
  }
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#pragma mark - Fabric Specific

// When the component unmounts we remove it from window's children,
// so when the component gets recycled we need to add it back.
- (void)maybeShow
{
  UIWindow *window = ABI49_0_0RCTSharedApplication().delegate.window;
  if (![[window subviews] containsObject:self]) {
    [window addSubview:_container];
  }
}

+ (ABI49_0_0facebook::ABI49_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI49_0_0facebook::ABI49_0_0React::concreteComponentDescriptorProvider<
      ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSFullWindowOverlayComponentDescriptor>();
}

- (void)prepareForRecycle
{
  [_container removeFromSuperview];
  // Due to view recycling we don't really want to set _container = nil
  // as it won't be instantiated when the component appears for the second time.
  // We could consider nulling in here & using container (lazy getter) everywhere else.
  // _container = nil;
  [super prepareForRecycle];
}

- (void)mountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // When the component unmounts we remove it from window's children,
  // so when the component gets recycled we need to add it back.
  // As for now it is called here as we lack of method that is called
  // just before component gets restored (from recycle pool).
  [self maybeShow];
  [self addSubview:childComponentView];
}

- (void)unmountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)updateLayoutMetrics:(ABI49_0_0facebook::ABI49_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI49_0_0facebook::ABI49_0_0React::LayoutMetrics const &)oldLayoutMetrics
{
  CGRect frame = ABI49_0_0RCTCGRectFromRect(layoutMetrics.frame);
  _reactFrame = frame;
  [_container setFrame:frame];
}

#else
#pragma mark - Paper specific

- (void)ABI49_0_0ReactSetFrame:(CGRect)frame
{
  _reactFrame = frame;
  [_container setFrame:frame];
}

- (void)invalidate
{
  [_container removeFromSuperview];
  _container = nil;
}

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@end

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RNSFullWindowOverlayCls(void)
{
  return ABI49_0_0RNSFullWindowOverlay.class;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@implementation ABI49_0_0RNSFullWindowOverlayManager

ABI49_0_0RCT_EXPORT_MODULE()

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#else
- (UIView *)view
{
  return [[ABI49_0_0RNSFullWindowOverlay alloc] initWithBridge:self.bridge];
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@end
