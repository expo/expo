#import "RNCSafeAreaViewComponentView.h"

#import <react/renderer/components/safeareacontext/EventEmitters.h>
#import <react/renderer/components/safeareacontext/Props.h>
#import <react/renderer/components/safeareacontext/RCTComponentViewHelpers.h>
#import <react/renderer/components/safeareacontext/RNCSafeAreaViewComponentDescriptor.h>
#import <react/renderer/components/safeareacontext/RNCSafeAreaViewShadowNode.h>

#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"
#import "RNCSafeAreaProviderComponentView.h"
#import "RNCSafeAreaUtils.h"

using namespace facebook::react;

@interface RNCSafeAreaViewComponentView () <RCTRNCSafeAreaViewViewProtocol>
@end

@implementation RNCSafeAreaViewComponentView {
  RNCSafeAreaViewShadowNode::ConcreteState::Shared _state;
  UIEdgeInsets _currentSafeAreaInsets;
  __weak UIView *_Nullable _providerView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNCSafeAreaViewProps>();
    _props = defaultProps;
  }

  return self;
}

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; RNCSafeAreaInsets = %@; appliedRNCSafeAreaInsets = %@>",
                                    superDescription,
                                    NSStringFromUIEdgeInsets(_providerView.safeAreaInsets),
                                    NSStringFromUIEdgeInsets(_currentSafeAreaInsets)];
}

- (void)didMoveToWindow
{
  UIView *previousProviderView = _providerView;
  _providerView = [self findNearestProvider];

  [self updateStateIfNecessary];

  if (previousProviderView != _providerView) {
    [NSNotificationCenter.defaultCenter
     removeObserver:self
     name:RNCSafeAreaDidChange
     object:previousProviderView];
    [NSNotificationCenter.defaultCenter
     addObserver:self
     selector:@selector(safeAreaProviderInsetsDidChange:)
     name:RNCSafeAreaDidChange
     object:_providerView];
  }
}

- (void)safeAreaProviderInsetsDidChange:(NSNotification *)notification
{
  [self updateStateIfNecessary];
}

- (void)updateStateIfNecessary
{
  if (_providerView == nil) {
    return;
  }
  UIEdgeInsets safeAreaInsets = _providerView.safeAreaInsets;

  if (UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale())) {
    return;
  }

  _currentSafeAreaInsets = safeAreaInsets;
  [self updateState];
}

- (UIView *)findNearestProvider
{
  UIView *current = self.superview;
  while (current != nil) {
    if ([current isKindOfClass:RNCSafeAreaProviderComponentView.class]) {
      return current;
    }
    current = current.superview;
  }
  return self;
}

- (void)updateState
{
  if (!_state) {
    return;
  }

  _state->updateState(
      [=](RNCSafeAreaViewShadowNode::ConcreteState::Data const &oldData)
          -> RNCSafeAreaViewShadowNode::ConcreteState::SharedData {
        auto newData = oldData;
        newData.insets = RCTEdgeInsetsFromUIEdgeInsets(_currentSafeAreaInsets);
        return std::make_shared<RNCSafeAreaViewShadowNode::ConcreteState::Data const>(newData);
      });
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNCSafeAreaViewComponentDescriptor>();
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<RNCSafeAreaViewShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  [self updateStateIfNecessary];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  [NSNotificationCenter.defaultCenter removeObserver:self];
  _state.reset();
  _providerView = nil;
  _currentSafeAreaInsets = UIEdgeInsetsZero;
}

@end

Class<RCTComponentViewProtocol> RNCSafeAreaViewCls(void)
{
  return RNCSafeAreaViewComponentView.class;
}
