/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTLegacyViewManagerInteropComponentView.h"

#import <ABI43_0_0React/ABI43_0_0UIView+React.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#import <ABI43_0_0React/ABI43_0_0utils/ManagedObjectWrapper.h>
#import "ABI43_0_0RCTLegacyViewManagerInteropCoordinatorAdapter.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

static NSString *const kABI43_0_0RCTLegacyInteropChildComponentKey = @"childComponentView";
static NSString *const kABI43_0_0RCTLegacyInteropChildIndexKey = @"index";

@implementation ABI43_0_0RCTLegacyViewManagerInteropComponentView {
  NSMutableArray<NSDictionary *> *_viewsToBeMounted;
  NSMutableArray<UIView *> *_viewsToBeUnmounted;
  ABI43_0_0RCTLegacyViewManagerInteropCoordinatorAdapter *_adapter;
  LegacyViewManagerInteropShadowNode::ConcreteStateTeller _stateTeller;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
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
  static NSMutableSet<NSString *> *supported = [NSMutableSet setWithObjects:@"Picker",
                                                                            @"DatePicker",
                                                                            @"ProgressView",
                                                                            @"SegmentedControl",
                                                                            @"MaskedView",
                                                                            @"ABI43_0_0ARTSurfaceView",
                                                                            @"ABI43_0_0ARTText",
                                                                            @"ABI43_0_0ARTShape",
                                                                            @"ABI43_0_0ARTGroup",
                                                                            nil];
  return supported;
}

+ (BOOL)isSupported:(NSString *)componentName
{
  return [[ABI43_0_0RCTLegacyViewManagerInteropComponentView supportedViewManagers] containsObject:componentName];
}

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName
{
  [[ABI43_0_0RCTLegacyViewManagerInteropComponentView supportedViewManagers] addObject:componentName];
}

- (ABI43_0_0RCTLegacyViewManagerInteropCoordinator *)coordinator
{
  auto data = _stateTeller.getData();
  if (data.hasValue()) {
    return unwrapManagedObject(data.value().coordinator);
  } else {
    return nil;
  }
}

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  return self.coordinator.componentViewName;
}

#pragma mark - ABI43_0_0RCTComponentViewProtocol

- (void)prepareForRecycle
{
  _adapter = nil;
  [_viewsToBeMounted removeAllObjects];
  [_viewsToBeUnmounted removeAllObjects];
  _stateTeller.invalidate();
  self.contentView = nil;
  [super prepareForRecycle];
}

- (void)mountChildComponentView:(UIView<ABI43_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_viewsToBeMounted addObject:@{
    kABI43_0_0RCTLegacyInteropChildIndexKey : [NSNumber numberWithInteger:index],
    kABI43_0_0RCTLegacyInteropChildComponentKey : childComponentView
  }];
}

- (void)unmountChildComponentView:(UIView<ABI43_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (_adapter) {
    [_adapter.paperView removeABI43_0_0ReactSubview:childComponentView];
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
  _stateTeller.setConcreteState(state);
}

- (void)finalizeUpdates:(ABI43_0_0RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];

  if (!_adapter) {
    _adapter = [[ABI43_0_0RCTLegacyViewManagerInteropCoordinatorAdapter alloc] initWithCoordinator:self.coordinator
                                                                                 ABI43_0_0ReactTag:self.tag];
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
    NSNumber *index = mountInstruction[kABI43_0_0RCTLegacyInteropChildIndexKey];
    UIView *childView = mountInstruction[kABI43_0_0RCTLegacyInteropChildComponentKey];
    [_adapter.paperView insertABI43_0_0ReactSubview:childView atIndex:index.integerValue];
  }

  [_viewsToBeMounted removeAllObjects];

  for (UIView *view in _viewsToBeUnmounted) {
    [_adapter.paperView removeABI43_0_0ReactSubview:view];
  }

  [_viewsToBeUnmounted removeAllObjects];

  [_adapter.paperView didUpdateABI43_0_0ReactSubviews];

  if (updateMask & ABI43_0_0RNComponentViewUpdateMaskProps) {
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
