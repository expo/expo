#import <UIKit/UIKit.h>

#import "RNSFullWindowOverlay.h"

#ifdef RN_FABRIC_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/RCTComponentViewHelpers.h>
#else
#import <React/RCTTouchHandler.h>
#endif // RN_FABRIC_ENABLED

@implementation RNSFullWindowOverlayContainer

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  for (UIView *view in [self subviews]) {
    if (view.userInteractionEnabled && [view pointInside:[self convertPoint:point toView:view] withEvent:event]) {
      return YES;
    }
  }
  return NO;
}

@end

@implementation RNSFullWindowOverlay {
  __weak RCTBridge *_bridge;
  RNSFullWindowOverlayContainer *_container;
  CGRect _reactFrame;
#ifdef RN_FABRIC_ENABLED
  RCTSurfaceTouchHandler *_touchHandler;
#else
  RCTTouchHandler *_touchHandler;
#endif // RN_FABRIC_ENABLED
}

#ifdef RN_FABRIC_ENABLED
- (instancetype)init
{
  if (self = [super init]) {
    static const auto defaultProps = std::make_shared<const facebook::react::RNSFullWindowOverlayProps>();
    _props = defaultProps;
    [self _initCommon];
  }
  return self;
}
#endif // RN_FABRIC_ENABLED

- (instancetype)initWithBridge:(RCTBridge *)bridge
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

- (RNSFullWindowOverlayContainer *)container
{
  if (_container == nil) {
    _container = [[RNSFullWindowOverlayContainer alloc] initWithFrame:_reactFrame];
  }

  return _container;
}

- (void)show
{
  UIWindow *window = RCTSharedApplication().delegate.window;
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
#ifdef RN_FABRIC_ENABLED
      _touchHandler = [RCTSurfaceTouchHandler new];
#else
      _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
#endif
    }
    [_touchHandler attachToView:_container];
  }
}

#ifdef RN_FABRIC_ENABLED
#pragma mark - Fabric Specific

// When the component unmounts we remove it from window's children,
// so when the component gets recycled we need to add it back.
- (void)maybeShow
{
  UIWindow *window = RCTSharedApplication().delegate.window;
  if (![[window subviews] containsObject:self]) {
    [window addSubview:_container];
  }
}

+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider
{
  return facebook::react::concreteComponentDescriptorProvider<
      facebook::react::RNSFullWindowOverlayComponentDescriptor>();
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

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // When the component unmounts we remove it from window's children,
  // so when the component gets recycled we need to add it back.
  // As for now it is called here as we lack of method that is called
  // just before component gets restored (from recycle pool).
  [self maybeShow];
  [self addSubview:childComponentView];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)updateLayoutMetrics:(facebook::react::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(facebook::react::LayoutMetrics const &)oldLayoutMetrics
{
  CGRect frame = RCTCGRectFromRect(layoutMetrics.frame);
  _reactFrame = frame;
  [_container setFrame:frame];
}

#else
#pragma mark - Paper specific

- (void)reactSetFrame:(CGRect)frame
{
  _reactFrame = frame;
  [_container setFrame:frame];
}

- (void)invalidate
{
  [_container removeFromSuperview];
  _container = nil;
}

#endif // RN_FABRIC_ENABLED

@end

#ifdef RN_FABRIC_ENABLED
Class<RCTComponentViewProtocol> RNSFullWindowOverlayCls(void)
{
  return RNSFullWindowOverlay.class;
}
#endif // RN_FABRIC_ENABLED

@implementation RNSFullWindowOverlayManager

RCT_EXPORT_MODULE()

#ifdef RN_FABRIC_ENABLED
#else
- (UIView *)view
{
  return [[RNSFullWindowOverlay alloc] initWithBridge:self.bridge];
}
#endif // RN_FABRIC_ENABLED

@end
