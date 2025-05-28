#import "PeekAndPop.h"

#import <RNScreens/RNSScreen.h>
#import <RNScreens/RNSScreenStack.h>
#import <UIKit/UIKit.h>
#import <react/renderer/components/AppSpec/ComponentDescriptors.h>
#import <react/renderer/components/AppSpec/EventEmitters.h>
#import <react/renderer/components/AppSpec/Props.h>
#import <react/renderer/components/AppSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface PeekAndPopTrigger () <RCTPeekAndPopTriggerViewProtocol>
@end

@implementation PeekAndPopTrigger {
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
  *std::static_pointer_cast<PeekAndPopTriggerProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<PeekAndPopTriggerProps const>(props);

  [super updateProps:props oldProps:oldProps];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PeekAndPopTriggerComponentDescriptor>();
}

@end
