#ifdef RCT_NEW_ARCH_ENABLED

#import "RNGestureHandlerButtonComponentView.h"

#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/rngesturehandler_codegen/ComponentDescriptors.h>
#import <react/renderer/components/rngesturehandler_codegen/EventEmitters.h>
#import <react/renderer/components/rngesturehandler_codegen/Props.h>
#import <react/renderer/components/rngesturehandler_codegen/RCTComponentViewHelpers.h>

#import "RNGestureHandlerButton.h"

using namespace facebook::react;

@interface RNGestureHandlerButtonComponentView () <RCTRNGestureHandlerButtonViewProtocol>
@end

@implementation RNGestureHandlerButtonComponentView {
  RNGestureHandlerButton *_buttonView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNGestureHandlerButtonProps>();
    _props = defaultProps;
    _buttonView = [[RNGestureHandlerButton alloc] initWithFrame:self.bounds];

    self.contentView = _buttonView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNGestureHandlerButtonComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const RNGestureHandlerButtonProps>(props);

  _buttonView.userEnabled = newProps.enabled;
#if !TARGET_OS_TV
  _buttonView.exclusiveTouch = newProps.exclusive;
#endif
  _buttonView.hitTestEdgeInsets = UIEdgeInsetsMake(
      -newProps.hitSlop.top, -newProps.hitSlop.left, -newProps.hitSlop.bottom, -newProps.hitSlop.right);

  [super updateProps:props oldProps:oldProps];
}
@end

Class<RCTComponentViewProtocol> RNGestureHandlerButtonCls(void)
{
  return RNGestureHandlerButtonComponentView.class;
}

#endif // RCT_NEW_ARCH_ENABLED
