#ifdef RN_FABRIC_ENABLED

#import "RNGestureHandlerButtonComponentView.h"

#import <React/RCTConversions.h>

#import <react/renderer/components/rngesturehandler/ComponentDescriptors.h>
#import <react/renderer/components/rngesturehandler/EventEmitters.h>
#import <react/renderer/components/rngesturehandler/Props.h>
#import <react/renderer/components/rngesturehandler/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "RNGestureHandlerButton.h"

using namespace facebook::react;

@interface RNGestureHandlerButtonComponentView () <RCTRNGestureHandlerButtonViewProtocol>
@end

@implementation RNGestureHandlerButtonComponentView
{
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
    _buttonView.exclusiveTouch = newProps.exclusive;

    [super updateProps:props oldProps:oldProps];
}
@end

Class<RCTComponentViewProtocol> RNGestureHandlerButtonCls(void)
{
  return RNGestureHandlerButtonComponentView.class;
}

#endif // RN_FABRIC_ENABLED
