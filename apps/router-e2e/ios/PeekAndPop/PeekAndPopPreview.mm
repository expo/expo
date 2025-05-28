#import "PeekAndPop.h"

#import <RNScreens/RNSScreen.h>
#import <RNScreens/RNSScreenStack.h>
#import <UIKit/UIKit.h>
#import <React/RCTConversions.h>
#import <react/renderer/components/AppSpec/ComponentDescriptors.h>
#import <react/renderer/components/AppSpec/EventEmitters.h>
#import <react/renderer/components/AppSpec/Props.h>
#import <react/renderer/components/AppSpec/States.h>
#import <react/renderer/components/AppSpec/RCTComponentViewHelpers.h>
#import "PeekAndPopPreviewShadowNode.h"
#import "PeekAndPopPreviewComponentDescriptor.h"

using namespace facebook::react;

@interface PeekAndPopPreview () <RCTPeekAndPopPreviewViewProtocol> {
  PeekAndPopPreviewShadowNode::ConcreteState::Shared _state;
}
@end

@implementation PeekAndPopPreview {
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
  *std::static_pointer_cast<PeekAndPopPreviewProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<PeekAndPopPreviewProps const>(props);

  [super updateProps:props oldProps:oldProps];
}

- (void)updateShadowStateWithBounds:(CGRect)bounds
{
  if (_state != nullptr) {
    auto newState = PeekAndPopPreviewState(bounds.size.width, bounds.size.height);
    _state->updateState(std::move(newState));
  }
}

- (void)updateState:(react::State::Shared const &)state oldState:(react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const react::PeekAndPopPreviewShadowNode::ConcreteState>(state);
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PeekAndPopPreviewComponentDescriptor>();
}

@end


@interface PreviewViewController() {
  PeekAndPopPreview *_peekAndPopPreview;
}
@end

@implementation PreviewViewController

-(instancetype)initWithPeekAndPopPreview:(PeekAndPopPreview *)peekAndPopPreview {
    self = [super init];
    if (self) {
        _peekAndPopPreview = peekAndPopPreview;
    }
    return self;
}

- (void)viewDidAppear:(BOOL)animated {
    [super viewDidAppear:animated];
  [_peekAndPopPreview updateShadowStateWithBounds:self.view.bounds];
    NSLog(@"Actual preview size: %@", NSStringFromCGRect(self.view.bounds));
}

@end
