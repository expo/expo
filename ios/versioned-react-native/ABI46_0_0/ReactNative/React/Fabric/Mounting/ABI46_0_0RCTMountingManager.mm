/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTMountingManager.h"

#import <butter/map.h>

#import <ABI46_0_0React/ABI46_0_0RCTAssert.h>
#import <ABI46_0_0React/ABI46_0_0RCTComponent.h>
#import <ABI46_0_0React/ABI46_0_0RCTFollyConvert.h>
#import <ABI46_0_0React/ABI46_0_0RCTLog.h>
#import <ABI46_0_0React/ABI46_0_0RCTUtils.h>
#import <ABI46_0_0React/ABI46_0_0config/ABI46_0_0ReactNativeConfig.h>
#import <ABI46_0_0React/ABI46_0_0renderer/components/root/RootShadowNode.h>
#import <ABI46_0_0React/ABI46_0_0renderer/core/LayoutableShadowNode.h>
#import <ABI46_0_0React/ABI46_0_0renderer/core/RawProps.h>
#import <ABI46_0_0React/ABI46_0_0renderer/debug/SystraceSection.h>
#import <ABI46_0_0React/ABI46_0_0renderer/mounting/TelemetryController.h>

#import "ABI46_0_0RCTComponentViewProtocol.h"
#import "ABI46_0_0RCTComponentViewRegistry.h"
#import "ABI46_0_0RCTConversions.h"
#import "ABI46_0_0RCTMountingTransactionObserverCoordinator.h"

using namespace ABI46_0_0facebook::ABI46_0_0React;

static SurfaceId ABI46_0_0RCTSurfaceIdForView(UIView *view)
{
  do {
    if (ABI46_0_0RCTIsABI46_0_0ReactRootView(@(view.tag))) {
      return view.tag;
    }
    view = view.superview;
  } while (view != nil);

  return -1;
}

static void ABI46_0_0RCTPerformMountInstructions(
    ShadowViewMutationList const &mutations,
    ABI46_0_0RCTComponentViewRegistry *registry,
    ABI46_0_0RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  SystraceSection s("ABI46_0_0RCTPerformMountInstructions");

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

        UIView<ABI46_0_0RCTComponentViewProtocol> *newChildComponentView = newChildViewDescriptor.view;

        ABI46_0_0RCTAssert(newChildShadowView.props, @"`newChildShadowView.props` must not be null.");

        [newChildComponentView updateProps:newChildShadowView.props oldProps:oldChildShadowView.props];
        [newChildComponentView updateEventEmitter:newChildShadowView.eventEmitter];
        [newChildComponentView updateState:newChildShadowView.state oldState:oldChildShadowView.state];
        [newChildComponentView updateLayoutMetrics:newChildShadowView.layoutMetrics
                                  oldLayoutMetrics:oldChildShadowView.layoutMetrics];
        [newChildComponentView finalizeUpdates:ABI46_0_0RNComponentViewUpdateMaskAll];

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

      case ShadowViewMutation::Update: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &newChildShadowView = mutation.newChildShadowView;
        auto &newChildViewDescriptor = [registry componentViewDescriptorWithTag:newChildShadowView.tag];
        UIView<ABI46_0_0RCTComponentViewProtocol> *newChildComponentView = newChildViewDescriptor.view;

        auto mask = ABI46_0_0RNComponentViewUpdateMask{};

        ABI46_0_0RCTAssert(newChildShadowView.props, @"`newChildShadowView.props` must not be null.");

        if (oldChildShadowView.props != newChildShadowView.props) {
          [newChildComponentView updateProps:newChildShadowView.props oldProps:oldChildShadowView.props];
          mask |= ABI46_0_0RNComponentViewUpdateMaskProps;
        }

        if (oldChildShadowView.eventEmitter != newChildShadowView.eventEmitter) {
          [newChildComponentView updateEventEmitter:newChildShadowView.eventEmitter];
          mask |= ABI46_0_0RNComponentViewUpdateMaskEventEmitter;
        }

        if (oldChildShadowView.state != newChildShadowView.state) {
          [newChildComponentView updateState:newChildShadowView.state oldState:oldChildShadowView.state];
          mask |= ABI46_0_0RNComponentViewUpdateMaskState;
        }

        if (oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
          [newChildComponentView updateLayoutMetrics:newChildShadowView.layoutMetrics
                                    oldLayoutMetrics:oldChildShadowView.layoutMetrics];
          mask |= ABI46_0_0RNComponentViewUpdateMaskLayoutMetrics;
        }

        if (mask != ABI46_0_0RNComponentViewUpdateMaskNone) {
          [newChildComponentView finalizeUpdates:mask];
        }

        break;
      }
    }
  }
  [CATransaction commit];
}

@implementation ABI46_0_0RCTMountingManager {
  ABI46_0_0RCTMountingTransactionObserverCoordinator _observerCoordinator;
  BOOL _transactionInFlight;
  BOOL _followUpTransactionRequired;
  ContextContainer::Shared _contextContainer;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [ABI46_0_0RCTComponentViewRegistry new];
  }

  return self;
}

- (void)setContextContainer:(ContextContainer::Shared)contextContainer
{
  _contextContainer = contextContainer;
}

- (void)attachSurfaceToView:(UIView *)view surfaceId:(SurfaceId)surfaceId
{
  ABI46_0_0RCTAssertMainQueue();

  ABI46_0_0RCTAssert(view.subviews.count == 0, @"The view must not have any subviews.");

  ABI46_0_0RCTComponentViewDescriptor rootViewDescriptor =
      [_componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle() tag:surfaceId];
  [view addSubview:rootViewDescriptor.view];
}

- (void)detachSurfaceFromView:(UIView *)view surfaceId:(SurfaceId)surfaceId
{
  ABI46_0_0RCTAssertMainQueue();
  ABI46_0_0RCTComponentViewDescriptor rootViewDescriptor = [_componentViewRegistry componentViewDescriptorWithTag:surfaceId];

  [rootViewDescriptor.view removeFromSuperview];

  [_componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                              tag:surfaceId
                                          componentViewDescriptor:rootViewDescriptor];
}

- (void)scheduleTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  if (ABI46_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to do expensive copy of all mutations;
    // * No need to allocate a block.
    [self initiateTransaction:mountingCoordinator];
    return;
  }

  auto mountingCoordinatorCopy = mountingCoordinator;
  ABI46_0_0RCTExecuteOnMainQueue(^{
    ABI46_0_0RCTAssertMainQueue();
    [self initiateTransaction:mountingCoordinatorCopy];
  });
}

- (void)dispatchCommand:(ABI46_0_0ReactTag)ABI46_0_0ReactTag commandName:(NSString *)commandName args:(NSArray *)args
{
  if (ABI46_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchCommandOnUIThread:ABI46_0_0ReactTag commandName:commandName args:args];
    return;
  }

  ABI46_0_0RCTExecuteOnMainQueue(^{
    ABI46_0_0RCTAssertMainQueue();
    [self synchronouslyDispatchCommandOnUIThread:ABI46_0_0ReactTag commandName:commandName args:args];
  });
}

- (void)sendAccessibilityEvent:(ABI46_0_0ReactTag)ABI46_0_0ReactTag eventType:(NSString *)eventType
{
  if (ABI46_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchAccessbilityEventOnUIThread:ABI46_0_0ReactTag eventType:eventType];
    return;
  }

  ABI46_0_0RCTExecuteOnMainQueue(^{
    ABI46_0_0RCTAssertMainQueue();
    [self synchronouslyDispatchAccessbilityEventOnUIThread:ABI46_0_0ReactTag eventType:eventType];
  });
}

- (void)initiateTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[ABI46_0_0RCTMountingManager initiateTransaction:]");
  ABI46_0_0RCTAssertMainQueue();

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
  SystraceSection s("-[ABI46_0_0RCTMountingManager performTransaction:]");
  ABI46_0_0RCTAssertMainQueue();

  auto surfaceId = mountingCoordinator->getSurfaceId();

  mountingCoordinator->getTelemetryController().pullTransaction(
      [&](MountingTransaction const &transaction, SurfaceTelemetry const &surfaceTelemetry) {
        [self.delegate mountingManager:self willMountComponentsWithRootTag:surfaceId];
        _observerCoordinator.notifyObserversMountingTransactionWillMount(transaction, surfaceTelemetry);
      },
      [&](MountingTransaction const &transaction, SurfaceTelemetry const &surfaceTelemetry) {
        ABI46_0_0RCTPerformMountInstructions(
            transaction.getMutations(), _componentViewRegistry, _observerCoordinator, surfaceId);
      },
      [&](MountingTransaction const &transaction, SurfaceTelemetry const &surfaceTelemetry) {
        _observerCoordinator.notifyObserversMountingTransactionDidMount(transaction, surfaceTelemetry);
        [self.delegate mountingManager:self didMountComponentsWithRootTag:surfaceId];
      });
}

- (void)setIsJSResponder:(BOOL)isJSResponder
    blockNativeResponder:(BOOL)blockNativeResponder
           forShadowView:(ABI46_0_0facebook::ABI46_0_0React::ShadowView)shadowView
{
  ABI46_0_0RCTExecuteOnMainQueue(^{
    UIView<ABI46_0_0RCTComponentViewProtocol> *componentView =
        [self->_componentViewRegistry findComponentViewWithTag:shadowView.tag];
    [componentView setIsJSResponder:isJSResponder];
  });
}

- (void)synchronouslyUpdateViewOnUIThread:(ABI46_0_0ReactTag)ABI46_0_0ReactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ComponentDescriptor &)componentDescriptor
{
  ABI46_0_0RCTAssertMainQueue();
  UIView<ABI46_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI46_0_0ReactTag];
  SurfaceId surfaceId = ABI46_0_0RCTSurfaceIdForView(componentView);
  SharedProps oldProps = [componentView props];
  SharedProps newProps = componentDescriptor.cloneProps(
      PropsParserContext{surfaceId, *_contextContainer.get()}, oldProps, RawProps(convertIdToFollyDynamic(props)));

  NSSet<NSString *> *propKeys = componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN ?: [NSSet new];
  propKeys = [propKeys setByAddingObjectsFromArray:props.allKeys];
  componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = nil;
  [componentView updateProps:newProps oldProps:oldProps];
  componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = propKeys;

  const auto &newViewProps = *std::static_pointer_cast<const ViewProps>(newProps);

  if (props[@"transform"] &&
      !CATransform3DEqualToTransform(
          ABI46_0_0RCTCATransform3DFromTransformMatrix(newViewProps.transform), componentView.layer.transform)) {
    componentView.layer.transform = ABI46_0_0RCTCATransform3DFromTransformMatrix(newViewProps.transform);
  }
  if (props[@"opacity"] && componentView.layer.opacity != (float)newViewProps.opacity) {
    componentView.layer.opacity = newViewProps.opacity;
  }

  auto ABI46_0_0ReactNativeConfig = _contextContainer->at<std::shared_ptr<ABI46_0_0ReactNativeConfig const>>("ABI46_0_0ReactNativeConfig");
  if (ABI46_0_0ReactNativeConfig && ABI46_0_0ReactNativeConfig->getBool("ABI46_0_0React_fabric:finalize_updates_on_synchronous_update_view_ios")) {
    [componentView finalizeUpdates:ABI46_0_0RNComponentViewUpdateMaskProps];
  }
}

- (void)synchronouslyDispatchCommandOnUIThread:(ABI46_0_0ReactTag)ABI46_0_0ReactTag
                                   commandName:(NSString *)commandName
                                          args:(NSArray *)args
{
  ABI46_0_0RCTAssertMainQueue();
  UIView<ABI46_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI46_0_0ReactTag];
  [componentView handleCommand:commandName args:args];
}

- (void)synchronouslyDispatchAccessbilityEventOnUIThread:(ABI46_0_0ReactTag)ABI46_0_0ReactTag eventType:(NSString *)eventType
{
  if ([@"focus" isEqualToString:eventType]) {
    UIView<ABI46_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI46_0_0ReactTag];
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, componentView);
  }
}

@end
