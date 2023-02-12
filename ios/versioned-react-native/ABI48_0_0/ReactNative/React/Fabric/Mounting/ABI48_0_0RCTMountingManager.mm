/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTMountingManager.h"

#import <ABI48_0_0butter/ABI48_0_0map.h>

#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>
#import <ABI48_0_0React/ABI48_0_0RCTComponent.h>
#import <ABI48_0_0React/ABI48_0_0RCTFollyConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0React/ABI48_0_0config/ABI48_0_0ReactNativeConfig.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/root/RootShadowNode.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/LayoutableShadowNode.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/RawProps.h>
#import <ABI48_0_0React/ABI48_0_0renderer/debug/SystraceSection.h>
#import <ABI48_0_0React/ABI48_0_0renderer/mounting/TelemetryController.h>

#import "ABI48_0_0RCTComponentViewProtocol.h"
#import "ABI48_0_0RCTComponentViewRegistry.h"
#import "ABI48_0_0RCTConversions.h"
#import "ABI48_0_0RCTMountingTransactionObserverCoordinator.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

static SurfaceId ABI48_0_0RCTSurfaceIdForView(UIView *view)
{
  do {
    if (ABI48_0_0RCTIsABI48_0_0ReactRootView(@(view.tag))) {
      return view.tag;
    }
    view = view.superview;
  } while (view != nil);

  return -1;
}

static void ABI48_0_0RCTPerformMountInstructions(
    ShadowViewMutationList const &mutations,
    ABI48_0_0RCTComponentViewRegistry *registry,
    ABI48_0_0RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  SystraceSection s("ABI48_0_0RCTPerformMountInstructions");

  [CATransaction begin];
  [CATransaction setValue:(id)kCFBooleanTrue forKey:kCATransactionDisableActions];
  for (auto const &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        auto &newChildShadowView = mutation.newChildShadowView;
        auto &newChildViewDescriptor =
            [registry dequeueComponentViewWithComponentHandle:newChildShadowView.componentHandle
                                                          tag:newChildShadowView.tag];
        observerCoordinator.registerViewComponentDescriptor(newChildViewDescriptor, surfaceId);
        break;
      }

      case ShadowViewMutation::Delete: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &oldChildViewDescriptor = [registry componentViewDescriptorWithTag:oldChildShadowView.tag];

        observerCoordinator.unregisterViewComponentDescriptor(oldChildViewDescriptor, surfaceId);

        [registry enqueueComponentViewWithComponentHandle:oldChildShadowView.componentHandle
                                                      tag:oldChildShadowView.tag
                                  componentViewDescriptor:oldChildViewDescriptor];
        break;
      }

      case ShadowViewMutation::Insert: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &newChildShadowView = mutation.newChildShadowView;
        auto &parentShadowView = mutation.parentShadowView;
        auto &newChildViewDescriptor = [registry componentViewDescriptorWithTag:newChildShadowView.tag];
        auto &parentViewDescriptor = [registry componentViewDescriptorWithTag:parentShadowView.tag];

        UIView<ABI48_0_0RCTComponentViewProtocol> *newChildComponentView = newChildViewDescriptor.view;

        ABI48_0_0RCTAssert(newChildShadowView.props, @"`newChildShadowView.props` must not be null.");

        [newChildComponentView updateProps:newChildShadowView.props oldProps:oldChildShadowView.props];
        [newChildComponentView updateEventEmitter:newChildShadowView.eventEmitter];
        [newChildComponentView updateState:newChildShadowView.state oldState:oldChildShadowView.state];
        [newChildComponentView updateLayoutMetrics:newChildShadowView.layoutMetrics
                                  oldLayoutMetrics:oldChildShadowView.layoutMetrics];
        [newChildComponentView finalizeUpdates:ABI48_0_0RNComponentViewUpdateMaskAll];

        [parentViewDescriptor.view mountChildComponentView:newChildComponentView index:mutation.index];
        break;
      }

      case ShadowViewMutation::Remove: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &parentShadowView = mutation.parentShadowView;
        auto &oldChildViewDescriptor = [registry componentViewDescriptorWithTag:oldChildShadowView.tag];
        auto &parentViewDescriptor = [registry componentViewDescriptorWithTag:parentShadowView.tag];
        [parentViewDescriptor.view unmountChildComponentView:oldChildViewDescriptor.view index:mutation.index];
        break;
      }

      case ShadowViewMutation::RemoveDeleteTree: {
        // TODO - not supported yet
        break;
      }

      case ShadowViewMutation::Update: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &newChildShadowView = mutation.newChildShadowView;
        auto &newChildViewDescriptor = [registry componentViewDescriptorWithTag:newChildShadowView.tag];
        UIView<ABI48_0_0RCTComponentViewProtocol> *newChildComponentView = newChildViewDescriptor.view;

        auto mask = ABI48_0_0RNComponentViewUpdateMask{};

        ABI48_0_0RCTAssert(newChildShadowView.props, @"`newChildShadowView.props` must not be null.");

        if (oldChildShadowView.props != newChildShadowView.props) {
          [newChildComponentView updateProps:newChildShadowView.props oldProps:oldChildShadowView.props];
          mask |= ABI48_0_0RNComponentViewUpdateMaskProps;
        }

        if (oldChildShadowView.eventEmitter != newChildShadowView.eventEmitter) {
          [newChildComponentView updateEventEmitter:newChildShadowView.eventEmitter];
          mask |= ABI48_0_0RNComponentViewUpdateMaskEventEmitter;
        }

        if (oldChildShadowView.state != newChildShadowView.state) {
          [newChildComponentView updateState:newChildShadowView.state oldState:oldChildShadowView.state];
          mask |= ABI48_0_0RNComponentViewUpdateMaskState;
        }

        if (oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
          [newChildComponentView updateLayoutMetrics:newChildShadowView.layoutMetrics
                                    oldLayoutMetrics:oldChildShadowView.layoutMetrics];
          mask |= ABI48_0_0RNComponentViewUpdateMaskLayoutMetrics;
        }

        if (mask != ABI48_0_0RNComponentViewUpdateMaskNone) {
          [newChildComponentView finalizeUpdates:mask];
        }

        break;
      }
    }
  }
  [CATransaction commit];
}

@implementation ABI48_0_0RCTMountingManager {
  ABI48_0_0RCTMountingTransactionObserverCoordinator _observerCoordinator;
  BOOL _transactionInFlight;
  BOOL _followUpTransactionRequired;
  ContextContainer::Shared _contextContainer;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [ABI48_0_0RCTComponentViewRegistry new];
  }

  return self;
}

- (void)setContextContainer:(ContextContainer::Shared)contextContainer
{
  _contextContainer = contextContainer;
}

- (void)attachSurfaceToView:(UIView *)view surfaceId:(SurfaceId)surfaceId
{
  ABI48_0_0RCTAssertMainQueue();

  ABI48_0_0RCTAssert(view.subviews.count == 0, @"The view must not have any subviews.");

  ABI48_0_0RCTComponentViewDescriptor rootViewDescriptor =
      [_componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle() tag:surfaceId];
  [view addSubview:rootViewDescriptor.view];
}

- (void)detachSurfaceFromView:(UIView *)view surfaceId:(SurfaceId)surfaceId
{
  ABI48_0_0RCTAssertMainQueue();
  ABI48_0_0RCTComponentViewDescriptor rootViewDescriptor = [_componentViewRegistry componentViewDescriptorWithTag:surfaceId];

  [rootViewDescriptor.view removeFromSuperview];

  [_componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                              tag:surfaceId
                                          componentViewDescriptor:rootViewDescriptor];
}

- (void)scheduleTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  if (ABI48_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to do expensive copy of all mutations;
    // * No need to allocate a block.
    [self initiateTransaction:mountingCoordinator];
    return;
  }

  auto mountingCoordinatorCopy = mountingCoordinator;
  ABI48_0_0RCTExecuteOnMainQueue(^{
    ABI48_0_0RCTAssertMainQueue();
    [self initiateTransaction:mountingCoordinatorCopy];
  });
}

- (void)dispatchCommand:(ABI48_0_0ReactTag)ABI48_0_0ReactTag commandName:(NSString *)commandName args:(NSArray *)args
{
  if (ABI48_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchCommandOnUIThread:ABI48_0_0ReactTag commandName:commandName args:args];
    return;
  }

  ABI48_0_0RCTExecuteOnMainQueue(^{
    ABI48_0_0RCTAssertMainQueue();
    [self synchronouslyDispatchCommandOnUIThread:ABI48_0_0ReactTag commandName:commandName args:args];
  });
}

- (void)sendAccessibilityEvent:(ABI48_0_0ReactTag)ABI48_0_0ReactTag eventType:(NSString *)eventType
{
  if (ABI48_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchAccessbilityEventOnUIThread:ABI48_0_0ReactTag eventType:eventType];
    return;
  }

  ABI48_0_0RCTExecuteOnMainQueue(^{
    ABI48_0_0RCTAssertMainQueue();
    [self synchronouslyDispatchAccessbilityEventOnUIThread:ABI48_0_0ReactTag eventType:eventType];
  });
}

- (void)initiateTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[ABI48_0_0RCTMountingManager initiateTransaction:]");
  ABI48_0_0RCTAssertMainQueue();

  if (_transactionInFlight) {
    _followUpTransactionRequired = YES;
    return;
  }

  do {
    _followUpTransactionRequired = NO;
    _transactionInFlight = YES;
    [self performTransaction:mountingCoordinator];
    _transactionInFlight = NO;
  } while (_followUpTransactionRequired);
}

- (void)performTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[ABI48_0_0RCTMountingManager performTransaction:]");
  ABI48_0_0RCTAssertMainQueue();

  auto surfaceId = mountingCoordinator->getSurfaceId();

  mountingCoordinator->getTelemetryController().pullTransaction(
      [&](MountingTransaction const &transaction, SurfaceTelemetry const &surfaceTelemetry) {
        [self.delegate mountingManager:self willMountComponentsWithRootTag:surfaceId];
        _observerCoordinator.notifyObserversMountingTransactionWillMount(transaction, surfaceTelemetry);
      },
      [&](MountingTransaction const &transaction, SurfaceTelemetry const &surfaceTelemetry) {
        ABI48_0_0RCTPerformMountInstructions(
            transaction.getMutations(), _componentViewRegistry, _observerCoordinator, surfaceId);
      },
      [&](MountingTransaction const &transaction, SurfaceTelemetry const &surfaceTelemetry) {
        _observerCoordinator.notifyObserversMountingTransactionDidMount(transaction, surfaceTelemetry);
        [self.delegate mountingManager:self didMountComponentsWithRootTag:surfaceId];
      });
}

- (void)setIsJSResponder:(BOOL)isJSResponder
    blockNativeResponder:(BOOL)blockNativeResponder
           forShadowView:(ABI48_0_0facebook::ABI48_0_0React::ShadowView const &)shadowView
{
  ABI48_0_0ReactTag ABI48_0_0ReactTag = shadowView.tag;
  ABI48_0_0RCTExecuteOnMainQueue(^{
    UIView<ABI48_0_0RCTComponentViewProtocol> *componentView = [self->_componentViewRegistry findComponentViewWithTag:ABI48_0_0ReactTag];
    [componentView setIsJSResponder:isJSResponder];
  });
}

- (void)synchronouslyUpdateViewOnUIThread:(ABI48_0_0ReactTag)ABI48_0_0ReactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ComponentDescriptor &)componentDescriptor
{
  ABI48_0_0RCTAssertMainQueue();
  UIView<ABI48_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI48_0_0ReactTag];
  SurfaceId surfaceId = ABI48_0_0RCTSurfaceIdForView(componentView);
  Props::Shared oldProps = [componentView props];
  Props::Shared newProps = componentDescriptor.cloneProps(
      PropsParserContext{surfaceId, *_contextContainer.get()}, oldProps, RawProps(convertIdToFollyDynamic(props)));

  NSSet<NSString *> *propKeys = componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN ?: [NSSet new];
  propKeys = [propKeys setByAddingObjectsFromArray:props.allKeys];
  componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = nil;
  [componentView updateProps:newProps oldProps:oldProps];
  componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = propKeys;

  const auto &newViewProps = *std::static_pointer_cast<const ViewProps>(newProps);

  if (props[@"transform"] &&
      !CATransform3DEqualToTransform(
          ABI48_0_0RCTCATransform3DFromTransformMatrix(newViewProps.transform), componentView.layer.transform)) {
    componentView.layer.transform = ABI48_0_0RCTCATransform3DFromTransformMatrix(newViewProps.transform);
  }
  if (props[@"opacity"] && componentView.layer.opacity != (float)newViewProps.opacity) {
    componentView.layer.opacity = newViewProps.opacity;
  }

  [componentView finalizeUpdates:ABI48_0_0RNComponentViewUpdateMaskProps];
}

- (void)synchronouslyDispatchCommandOnUIThread:(ABI48_0_0ReactTag)ABI48_0_0ReactTag
                                   commandName:(NSString *)commandName
                                          args:(NSArray *)args
{
  ABI48_0_0RCTAssertMainQueue();
  UIView<ABI48_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI48_0_0ReactTag];
  [componentView handleCommand:commandName args:args];
}

- (void)synchronouslyDispatchAccessbilityEventOnUIThread:(ABI48_0_0ReactTag)ABI48_0_0ReactTag eventType:(NSString *)eventType
{
  if ([@"focus" isEqualToString:eventType]) {
    UIView<ABI48_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI48_0_0ReactTag];
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, componentView);
  }
}

@end
