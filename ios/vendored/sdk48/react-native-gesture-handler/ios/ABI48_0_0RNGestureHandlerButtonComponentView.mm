#ifdef ABI48_0_0RN_FABRIC_ENABLED

#import "ABI48_0_0RNGestureHandlerButtonComponentView.h"

#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>

#import <react/renderer/components/rngesturehandler_codegen/ComponentDescriptors.h>
#import <react/renderer/components/rngesturehandler_codegen/EventEmitters.h>
#import <react/renderer/components/rngesturehandler_codegen/Props.h>
#import <react/renderer/components/rngesturehandler_codegen/ABI48_0_0RCTComponentViewHelpers.h>

#import "ABI48_0_0RNGestureHandlerButton.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@interface ABI48_0_0RNGestureHandlerButtonComponentView () <ABI48_0_0RCTRNGestureHandlerButtonViewProtocol>
@end

@implementation ABI48_0_0RNGestureHandlerButtonComponentView {
  ABI48_0_0RNGestureHandlerButton *_buttonView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNGestureHandlerButtonProps>();
    _props = defaultProps;
    _buttonView = [[ABI48_0_0RNGestureHandlerButton alloc] initWithFrame:self.bounds];

    self.contentView = _buttonView;
  }

  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNGestureHandlerButtonComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNGestureHandlerButtonProps>(props);

  _buttonView.userEnabled = newProps.enabled;
  _buttonView.exclusiveTouch = newProps.exclusive;

  [super updateProps:props oldProps:oldProps];
}
@end

Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNGestureHandlerButtonCls(void)
{
  return ABI48_0_0RNGestureHandlerButtonComponentView.class;
}

#endif // ABI48_0_0RN_FABRIC_ENABLED
