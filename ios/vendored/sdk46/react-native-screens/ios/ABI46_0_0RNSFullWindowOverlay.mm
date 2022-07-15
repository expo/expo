#import <UIKit/UIKit.h>

#import "ABI46_0_0RNSFullWindowOverlay.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI46_0_0React/ABI46_0_0RCTConversions.h>
#import <ABI46_0_0React/ABI46_0_0RCTSurfaceTouchHandler.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/ABI46_0_0RCTComponentViewHelpers.h>
#import "ABI46_0_0RCTFabricComponentsPlugins.h"
#else
#import <ABI46_0_0React/ABI46_0_0RCTTouchHandler.h>
#endif // RN_FABRIC_ENABLED

@implementation ABI46_0_0RNSFullWindowOverlayContainer

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

@implementation ABI46_0_0RNSFullWindowOverlay {
  __weak ABI46_0_0RCTBridge *_bridge;
  ABI46_0_0RNSFullWindowOverlayContainer *_container;
  CGRect _reactFrame;
#ifdef RN_FABRIC_ENABLED
  ABI46_0_0RCTSurfaceTouchHandler *_touchHandler;
#else
  ABI46_0_0RCTTouchHandler *_touchHandler;
#endif // RN_FABRIC_ENABLED
}

#ifdef RN_FABRIC_ENABLED
- (instancetype)init
{
  if (self = [super init]) {
    static const auto defaultProps = std::make_shared<const ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSFullWindowOverlayProps>();
    _props = defaultProps;
    [self _initCommon];
  }
  return self;
}
#endif // RN_FABRIC_ENABLED

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge
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

- (ABI46_0_0RNSFullWindowOverlayContainer *)container
{
  if (_container == nil) {
    _container = [[ABI46_0_0RNSFullWindowOverlayContainer alloc] initWithFrame:_reactFrame];
  }

  return _container;
}

- (void)show
{
  UIWindow *window = ABI46_0_0RCTSharedApplication().delegate.window;
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
      _touchHandler = [ABI46_0_0RCTSurfaceTouchHandler new];
#else
      _touchHandler = [[ABI46_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
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
  UIWindow *window = ABI46_0_0RCTSharedApplication().delegate.window;
  if (![[window subviews] containsObject:self]) {
    [window addSubview:_container];
  }
}

+ (ABI46_0_0facebook::ABI46_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI46_0_0facebook::ABI46_0_0React::concreteComponentDescriptorProvider<
      ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSFullWindowOverlayComponentDescriptor>();
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

- (void)mountChildComponentView:(UIView<ABI46_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // When the component unmounts we remove it from window's children,
  // so when the component gets recycled we need to add it back.
  // As for now it is called here as we lack of method that is called
  // just before component gets restored (from recycle pool).
  [self maybeShow];
  [self addSubview:childComponentView];
}

- (void)unmountChildComponentView:(UIView<ABI46_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)updateLayoutMetrics:(ABI46_0_0facebook::ABI46_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI46_0_0facebook::ABI46_0_0React::LayoutMetrics const &)oldLayoutMetrics
{
  CGRect frame = ABI46_0_0RCTCGRectFromRect(layoutMetrics.frame);
  _reactFrame = frame;
  [_container setFrame:frame];
}

#else
#pragma mark - Paper specific

- (void)ABI46_0_0ReactSetFrame:(CGRect)frame
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
Class<ABI46_0_0RCTComponentViewProtocol> ABI46_0_0RNSFullWindowOverlayCls(void)
{
  return ABI46_0_0RNSFullWindowOverlay.class;
}
#endif // RN_FABRIC_ENABLED

@implementation ABI46_0_0RNSFullWindowOverlayManager

ABI46_0_0RCT_EXPORT_MODULE()

#ifdef RN_FABRIC_ENABLED
#else
- (UIView *)view
{
  return [[ABI46_0_0RNSFullWindowOverlay alloc] initWithBridge:self.bridge];
}
#endif // RN_FABRIC_ENABLED

@end
