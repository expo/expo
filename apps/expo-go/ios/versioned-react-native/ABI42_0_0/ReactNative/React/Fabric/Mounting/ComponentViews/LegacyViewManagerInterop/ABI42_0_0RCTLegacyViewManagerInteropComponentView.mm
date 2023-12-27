/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTLegacyViewManagerInteropComponentView.h"

#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import <ABI42_0_0React/components/legacyviewmanagerinterop/LegacyViewManagerInteropComponentDescriptor.h>
#import <ABI42_0_0React/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#import <ABI42_0_0React/utils/ManagedObjectWrapper.h>
#import "ABI42_0_0RCTLegacyViewManagerInteropCoordinatorAdapter.h"

using namespace ABI42_0_0facebook::ABI42_0_0React;

@implementation ABI42_0_0RCTLegacyViewManagerInteropComponentView {
  NSMutableDictionary<NSNumber *, UIView *> *_viewsToBeMounted;
  NSMutableArray<UIView *> *_viewsToBeUnmounted;
  ABI42_0_0RCTLegacyViewManagerInteropCoordinatorAdapter *_adapter;
  LegacyViewManagerInteropShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LegacyViewManagerInteropViewProps>();
    _props = defaultProps;
    _viewsToBeMounted = [NSMutableDictionary new];
    _viewsToBeUnmounted = [NSMutableArray new];
  }

  return self;
}

+ (NSMutableSet<NSString *> *)supportedViewManagers
{
  static NSMutableSet<NSString *> *supported =
      [NSMutableSet setWithObjects:@"Picker", @"DatePicker", @"ProgressView", @"SegmentedControl", @"MaskedView", nil];
  return supported;
}

+ (BOOL)isSupported:(NSString *)componentName
{
  return [[ABI42_0_0RCTLegacyViewManagerInteropComponentView supportedViewManagers] containsObject:componentName];
}

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName
{
  [[ABI42_0_0RCTLegacyViewManagerInteropComponentView supportedViewManagers] addObject:componentName];
}

- (ABI42_0_0RCTLegacyViewManagerInteropCoordinator *)coordinator
{
  if (_state != nullptr) {
    const auto &state = _state->getData();
    return unwrapManagedObject(state.coordinator);
  } else {
    return nil;
  }
}

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  const auto &state = _state->getData();
  ABI42_0_0RCTLegacyViewManagerInteropCoordinator *coordinator = unwrapManagedObject(state.coordinator);
  return coordinator.componentViewName;
}

#pragma mark - ABI42_0_0RCTComponentViewProtocol

- (void)prepareForRecycle
{
  _adapter = nil;
  [_viewsToBeMounted removeAllObjects];
  [_viewsToBeUnmounted removeAllObjects];
  _state.reset();
  [super prepareForRecycle];
}

- (void)mountChildComponentView:(UIView<ABI42_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_viewsToBeMounted setObject:childComponentView forKey:[NSNumber numberWithInteger:index]];
}

- (void)unmountChildComponentView:(UIView<ABI42_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_viewsToBeUnmounted addObject:childComponentView];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LegacyViewManagerInteropComponentDescriptor>();
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<LegacyViewManagerInteropShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(ABI42_0_0RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];

  if (!_adapter) {
    _adapter = [[ABI42_0_0RCTLegacyViewManagerInteropCoordinatorAdapter alloc] initWithCoordinator:self.coordinator
                                                                                 ABI42_0_0ReactTag:self.tag];
    __weak __typeof(self) weakSelf = self;
    _adapter.eventInterceptor = ^(std::string eventName, folly::dynamic event) {
      if (weakSelf) {
        __typeof(self) strongSelf = weakSelf;
        auto eventEmitter =
            std::static_pointer_cast<LegacyViewManagerInteropViewEventEmitter const>(strongSelf->_eventEmitter);
        eventEmitter->dispatchEvent(eventName, event);
      }
    };
    self.contentView = _adapter.paperView;
  }

  for (NSNumber *key in _viewsToBeMounted) {
    [_adapter.paperView insertABI42_0_0ReactSubview:_viewsToBeMounted[key] atIndex:key.integerValue];
  }

  [_viewsToBeMounted removeAllObjects];

  for (UIView *view in _viewsToBeUnmounted) {
    [_adapter.paperView removeABI42_0_0ReactSubview:view];
  }

  [_viewsToBeUnmounted removeAllObjects];

  [_adapter.paperView didUpdateABI42_0_0ReactSubviews];

  if (updateMask & ABI42_0_0RNComponentViewUpdateMaskProps) {
    const auto &newProps = *std::static_pointer_cast<const LegacyViewManagerInteropViewProps>(_props);
    [_adapter setProps:newProps.otherProps];
  }
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  [_adapter handleCommand:(NSString *)commandName args:(NSArray *)args];
}

@end
