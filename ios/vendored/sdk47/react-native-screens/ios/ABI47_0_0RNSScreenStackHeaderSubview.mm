#import "ABI47_0_0RNSScreenStackHeaderSubview.h"
#import "ABI47_0_0RNSConvert.h"

#ifdef RN_FABRIC_ENABLED
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/EventEmitters.h>
#import <react/renderer/components/rnscreens/ABI47_0_0RCTComponentViewHelpers.h>

#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#endif

@implementation ABI47_0_0RNSScreenStackHeaderSubview

#pragma mark - Common

#ifdef RN_FABRIC_ENABLED

#pragma mark - Fabric specific

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - ABI47_0_0RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [super prepareForRecycle];
}

- (void)updateProps:(ABI47_0_0facebook::ABI47_0_0React::Props::Shared const &)props
           oldProps:(ABI47_0_0facebook::ABI47_0_0React::Props::Shared const &)oldProps
{
  const auto &newHeaderSubviewProps =
      *std::static_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewProps>(props);
  const auto &oldHeaderSubviewProps =
      *std::static_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewProps>(_props);

  if (newHeaderSubviewProps.type != oldHeaderSubviewProps.type) {
    _type = [ABI47_0_0RNSConvert ABI47_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:newHeaderSubviewProps.type];
  }

  [super updateProps:props oldProps:oldProps];
}

+ (ABI47_0_0facebook::ABI47_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI47_0_0facebook::ABI47_0_0React::concreteComponentDescriptorProvider<
      ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewComponentDescriptor>();
}

- (void)updateLayoutMetrics:(const ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics &)oldLayoutMetrics
{
  CGRect frame = ABI47_0_0RCTCGRectFromRect(layoutMetrics.frame);
  // CALayer will crash if we pass NaN or Inf values.
  // It's unclear how to detect this case on cross-platform manner holistically, so we have to do it on the mounting
  // layer as well. NaN/Inf is a kinda valid result of some math operations. Even if we can (and should) detect (and
  // report early) incorrect (NaN and Inf) values which come from JavaScript side, we sometimes cannot backtrace the
  // sources of a calculation that produced an incorrect/useless result.
  if (!std::isfinite(frame.size.width) || !std::isfinite(frame.size.height)) {
    ABI47_0_0RCTLogWarn(
        @"-[UIView(ComponentViewProtocol) updateLayoutMetrics:oldLayoutMetrics:]: Received invalid layout metrics (%@) for a view (%@).",
        NSStringFromCGRect(frame),
        self);
  } else {
    self.bounds = CGRect{CGPointZero, frame.size};
  }
}

#else
#pragma mark - Paper specific

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)ABI47_0_0ReactSetFrame:(CGRect)frame
{
  // Block any attempt to set coordinates on ABI47_0_0RNSScreenStackHeaderSubview. This
  // makes UINavigationBar the only one to control the position of header content.
  [super ABI47_0_0ReactSetFrame:CGRectMake(0, 0, frame.size.width, frame.size.height)];
}

#endif // RN_FABRIC_ENABLED
@end

@implementation ABI47_0_0RNSScreenStackHeaderSubviewManager

ABI47_0_0RCT_EXPORT_MODULE()

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(type, ABI47_0_0RNSScreenStackHeaderSubviewType)

#ifdef RN_FABRIC_ENABLED
#else
- (UIView *)view
{
  return [[ABI47_0_0RNSScreenStackHeaderSubview alloc] initWithBridge:self.bridge];
}
#endif

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSScreenStackHeaderSubviewCls(void)
{
  return ABI47_0_0RNSScreenStackHeaderSubview.class;
}
#endif

@implementation ABI47_0_0RCTConvert (ABI47_0_0RNSScreenStackHeaderSubview)

ABI47_0_0RCT_ENUM_CONVERTER(
    ABI47_0_0RNSScreenStackHeaderSubviewType,
    (@{
      @"back" : @(ABI47_0_0RNSScreenStackHeaderSubviewTypeBackButton),
      @"left" : @(ABI47_0_0RNSScreenStackHeaderSubviewTypeLeft),
      @"right" : @(ABI47_0_0RNSScreenStackHeaderSubviewTypeRight),
      @"title" : @(ABI47_0_0RNSScreenStackHeaderSubviewTypeTitle),
      @"center" : @(ABI47_0_0RNSScreenStackHeaderSubviewTypeCenter),
      @"searchBar" : @(ABI47_0_0RNSScreenStackHeaderSubviewTypeSearchBar),
    }),
    ABI47_0_0RNSScreenStackHeaderSubviewTypeTitle,
    integerValue)

@end
