/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTLegacyViewManagerInteropComponentView.h"

#import <ABI45_0_0React/ABI45_0_0RCTAssert.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import <ABI45_0_0React/ABI45_0_0renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropComponentDescriptor.h>
#import <ABI45_0_0React/ABI45_0_0renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#import <ABI45_0_0React/ABI45_0_0utils/ManagedObjectWrapper.h>
#import "ABI45_0_0RCTLegacyViewManagerInteropCoordinatorAdapter.h"

using namespace ABI45_0_0facebook::ABI45_0_0React;

static NSString *const kABI45_0_0RCTLegacyInteropChildComponentKey = @"childComponentView";
static NSString *const kABI45_0_0RCTLegacyInteropChildIndexKey = @"index";

@implementation ABI45_0_0RCTLegacyViewManagerInteropComponentView {
  NSMutableArray<NSDictionary *> *_viewsToBeMounted;
  NSMutableArray<UIView *> *_viewsToBeUnmounted;
  ABI45_0_0RCTLegacyViewManagerInteropCoordinatorAdapter *_adapter;
  LegacyViewManagerInteropShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    ABI45_0_0RCTWarnNotAllowedForNewArchitecture(
        self, @"ViewManager with interop layer is not allowed in the new architecture.");
    static const auto defaultProps = std::make_shared<const LegacyViewManagerInteropViewProps>();
    _props = defaultProps;
    _viewsToBeMounted = [NSMutableArray new];
    _viewsToBeUnmounted = [NSMutableArray new];
  }

  return self;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  UIView *result = [super hitTest:point withEvent:event];

  if (result == _adapter.paperView) {
    return self;
  }

  return result;
}

+ (NSMutableSet<NSString *> *)supportedViewManagers
{
  static NSMutableSet<NSString *> *supported = [NSMutableSet setWithObjects:@"DatePicker",
                                                                            @"ProgressView",
                                                                            @"SegmentedControl",
                                                                            @"MaskedView",
                                                                            @"ABI45_0_0ARTSurfaceView",
                                                                            @"ABI45_0_0ARTText",
                                                                            @"ABI45_0_0ARTShape",
                                                                            @"ABI45_0_0ARTGroup",
                                                                            nil];
  return supported;
}

+ (BOOL)isSupported:(NSString *)componentName
{
  return [[ABI45_0_0RCTLegacyViewManagerInteropComponentView supportedViewManagers] containsObject:componentName];
}

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName
{
  [[ABI45_0_0RCTLegacyViewManagerInteropComponentView supportedViewManagers] addObject:componentName];
}

- (ABI45_0_0RCTLegacyViewManagerInteropCoordinator *)coordinator
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
  ABI45_0_0RCTLegacyViewManagerInteropCoordinator *coordinator = unwrapManagedObject(state.coordinator);
  return coordinator.componentViewName;
}

#pragma mark - ABI45_0_0RCTComponentViewProtocol

- (void)prepareForRecycle
{
  _adapter = nil;
  [_viewsToBeMounted removeAllObjects];
  [_viewsToBeUnmounted removeAllObjects];
  _state.reset();
  self.contentView = nil;
  [super prepareForRecycle];
}

- (void)mountChildComponentView:(UIView<ABI45_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_viewsToBeMounted addObject:@{
    kABI45_0_0RCTLegacyInteropChildIndexKey : [NSNumber numberWithInteger:index],
    kABI45_0_0RCTLegacyInteropChildComponentKey : childComponentView
  }];
}

- (void)unmountChildComponentView:(UIView<ABI45_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (_adapter) {
    [_adapter.paperView removeABI45_0_0ReactSubview:childComponentView];
  } else {
    [_viewsToBeUnmounted addObject:childComponentView];
  }
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LegacyViewManagerInteropComponentDescriptor>();
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<LegacyViewManagerInteropShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(ABI45_0_0RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];

  if (!_adapter) {
    _adapter = [[ABI45_0_0RCTLegacyViewManagerInteropCoordinatorAdapter alloc] initWithCoordinator:self.coordinator
                                                                                 ABI45_0_0ReactTag:self.tag];
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

  for (NSDictionary *mountInstruction in _viewsToBeMounted) {
    NSNumber *index = mountInstruction[kABI45_0_0RCTLegacyInteropChildIndexKey];
    UIView *childView = mountInstruction[kABI45_0_0RCTLegacyInteropChildComponentKey];
    [_adapter.paperView insertABI45_0_0ReactSubview:childView atIndex:index.integerValue];
  }

  [_viewsToBeMounted removeAllObjects];

  for (UIView *view in _viewsToBeUnmounted) {
    [_adapter.paperView removeABI45_0_0ReactSubview:view];
  }

  [_viewsToBeUnmounted removeAllObjects];

  [_adapter.paperView didUpdateABI45_0_0ReactSubviews];

  if (updateMask & ABI45_0_0RNComponentViewUpdateMaskProps) {
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
