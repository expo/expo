#ifdef ABI46_0_0RN_FABRIC_ENABLED

#import "ABI46_0_0RNGestureHandlerButtonComponentView.h"

#import <ABI46_0_0React/ABI46_0_0RCTConversions.h>

#import <react/renderer/components/rngesturehandler/ComponentDescriptors.h>
#import <react/renderer/components/rngesturehandler/EventEmitters.h>
#import <react/renderer/components/rngesturehandler/Props.h>
#import <react/renderer/components/rngesturehandler/ABI46_0_0RCTComponentViewHelpers.h>

#import "ABI46_0_0RCTFabricComponentsPlugins.h"
#import "ABI46_0_0RNGestureHandlerButton.h"

using namespace ABI46_0_0facebook::react;

@interface ABI46_0_0RNGestureHandlerButtonComponentView () <ABI46_0_0RCTRNGestureHandlerButtonViewProtocol>
@end

@implementation ABI46_0_0RNGestureHandlerButtonComponentView
{
    ABI46_0_0RNGestureHandlerButton *_buttonView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI46_0_0RNGestureHandlerButtonProps>();
    _props = defaultProps;
    _buttonView = [[ABI46_0_0RNGestureHandlerButton alloc] initWithFrame:self.bounds];
    
    self.contentView = _buttonView;
  }

  return self;
}

#pragma mark - ABI46_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI46_0_0RNGestureHandlerButtonComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
    const auto &newProps = *std::static_pointer_cast<const ABI46_0_0RNGestureHandlerButtonProps>(props);

    _buttonView.userEnabled = newProps.enabled;
    _buttonView.exclusiveTouch = newProps.exclusive;

    [super updateProps:props oldProps:oldProps];
}
@end

Class<ABI46_0_0RCTComponentViewProtocol> ABI46_0_0RNGestureHandlerButtonCls(void)
{
  return ABI46_0_0RNGestureHandlerButtonComponentView.class;
}

#endif // ABI46_0_0RN_FABRIC_ENABLED
