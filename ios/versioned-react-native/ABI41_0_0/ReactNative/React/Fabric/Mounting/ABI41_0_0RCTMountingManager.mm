/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTMountingManager.h"

#import <better/map.h>

#import <ABI41_0_0React/ABI41_0_0RCTAssert.h>
#import <ABI41_0_0React/ABI41_0_0RCTFollyConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>
#import <ABI41_0_0React/core/LayoutableShadowNode.h>
#import <ABI41_0_0React/core/RawProps.h>
#import <ABI41_0_0React/debug/SystraceSection.h>

#import "ABI41_0_0RCTComponentViewProtocol.h"
#import "ABI41_0_0RCTComponentViewRegistry.h"
#import "ABI41_0_0RCTConversions.h"
#import "ABI41_0_0RCTMountingTransactionObserverCoordinator.h"

using namespace ABI41_0_0facebook;
using namespace ABI41_0_0facebook::ABI41_0_0React;

// `Create` instruction
static void ABI41_0_0RNCreateMountInstruction(
    ShadowViewMutation const &mutation,
    ABI41_0_0RCTComponentViewRegistry *registry,
    ABI41_0_0RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  auto componentViewDescriptor =
      [registry dequeueComponentViewWithComponentHandle:mutation.newChildShadowView.componentHandle
                                                    tag:mutation.newChildShadowView.tag];

  observerCoordinator.registerViewComponentDescriptor(componentViewDescriptor, surfaceId);
}

// `Delete` instruction
static void ABI41_0_0RNDeleteMountInstruction(
    ShadowViewMutation const &mutation,
    ABI41_0_0RCTComponentViewRegistry *registry,
    ABI41_0_0RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  auto const &oldChildShadowView = mutation.oldChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:oldChildShadowView.tag];
  observerCoordinator.unregisterViewComponentDescriptor(componentViewDescriptor, surfaceId);
  [registry enqueueComponentViewWithComponentHandle:oldChildShadowView.componentHandle
                                                tag:oldChildShadowView.tag
                            componentViewDescriptor:componentViewDescriptor];
}

// `Insert` instruction
static void ABI41_0_0RNInsertMountInstruction(ShadowViewMutation const &mutation, ABI41_0_0RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  auto const &childComponentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  auto const &parentComponentViewDescriptor = [registry componentViewDescriptorWithTag:parentShadowView.tag];

  [parentComponentViewDescriptor.view mountChildComponentView:childComponentViewDescriptor.view index:mutation.index];
}

// `Remove` instruction
static void ABI41_0_0RNRemoveMountInstruction(ShadowViewMutation const &mutation, ABI41_0_0RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &parentShadowView = mutation.parentShadowView;

  auto const &childComponentViewDescriptor = [registry componentViewDescriptorWithTag:oldShadowView.tag];
  auto const &parentComponentViewDescriptor = [registry componentViewDescriptorWithTag:parentShadowView.tag];

  [parentComponentViewDescriptor.view unmountChildComponentView:childComponentViewDescriptor.view index:mutation.index];
}

// `Update Props` instruction
static void ABI41_0_0RNUpdatePropsMountInstruction(ShadowViewMutation const &mutation, ABI41_0_0RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateProps:newShadowView.props oldProps:oldShadowView.props];
}

// `Update EventEmitter` instruction
static void ABI41_0_0RNUpdateEventEmitterMountInstruction(ShadowViewMutation const &mutation, ABI41_0_0RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateEventEmitter:newShadowView.eventEmitter];
}

// `Update LayoutMetrics` instruction
static void ABI41_0_0RNUpdateLayoutMetricsMountInstruction(
    ShadowViewMutation const &mutation,
    ABI41_0_0RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateLayoutMetrics:newShadowView.layoutMetrics
                                   oldLayoutMetrics:oldShadowView.layoutMetrics];
}

// `Update State` instruction
static void ABI41_0_0RNUpdateStateMountInstruction(ShadowViewMutation const &mutation, ABI41_0_0RCTComponentViewRegistry *registry)
{
  auto const &oldShadowView = mutation.oldChildShadowView;
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view updateState:newShadowView.state oldState:oldShadowView.state];
}

// `Finalize Updates` instruction
static void ABI41_0_0RNFinalizeUpdatesMountInstruction(
    ShadowViewMutation const &mutation,
    ABI41_0_0RNComponentViewUpdateMask mask,
    ABI41_0_0RCTComponentViewRegistry *registry)
{
  auto const &newShadowView = mutation.newChildShadowView;
  auto const &componentViewDescriptor = [registry componentViewDescriptorWithTag:newShadowView.tag];
  [componentViewDescriptor.view finalizeUpdates:mask];
}

// `Update` instruction
static void ABI41_0_0RNPerformMountInstructions(
    ShadowViewMutationList const &mutations,
    ABI41_0_0RCTComponentViewRegistry *registry,
    ABI41_0_0RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  SystraceSection s("ABI41_0_0RNPerformMountInstructions");

  [CATransaction begin];
  [CATransaction setValue:(id)kCFBooleanTrue forKey:kCATransactionDisableActions];
  for (auto const &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        ABI41_0_0RNCreateMountInstruction(mutation, registry, observerCoordinator, surfaceId);
        break;
      }
      case ShadowViewMutation::Delete: {
        ABI41_0_0RNDeleteMountInstruction(mutation, registry, observerCoordinator, surfaceId);
        break;
      }
      case ShadowViewMutation::Insert: {
        ABI41_0_0RNUpdatePropsMountInstruction(mutation, registry);
        ABI41_0_0RNUpdateEventEmitterMountInstruction(mutation, registry);
        ABI41_0_0RNUpdateStateMountInstruction(mutation, registry);
        ABI41_0_0RNUpdateLayoutMetricsMountInstruction(mutation, registry);
        ABI41_0_0RNFinalizeUpdatesMountInstruction(mutation, ABI41_0_0RNComponentViewUpdateMaskAll, registry);
        ABI41_0_0RNInsertMountInstruction(mutation, registry);
        break;
      }
      case ShadowViewMutation::Remove: {
        ABI41_0_0RNRemoveMountInstruction(mutation, registry);
        break;
      }
      case ShadowViewMutation::Update: {
        auto const &oldChildShadowView = mutation.oldChildShadowView;
        auto const &newChildShadowView = mutation.newChildShadowView;

        auto mask = ABI41_0_0RNComponentViewUpdateMask{};

        if (oldChildShadowView.props != newChildShadowView.props) {
          ABI41_0_0RNUpdatePropsMountInstruction(mutation, registry);
          mask |= ABI41_0_0RNComponentViewUpdateMaskProps;
        }
        if (oldChildShadowView.eventEmitter != newChildShadowView.eventEmitter) {
          ABI41_0_0RNUpdateEventEmitterMountInstruction(mutation, registry);
          mask |= ABI41_0_0RNComponentViewUpdateMaskEventEmitter;
        }
        if (oldChildShadowView.state != newChildShadowView.state) {
          ABI41_0_0RNUpdateStateMountInstruction(mutation, registry);
          mask |= ABI41_0_0RNComponentViewUpdateMaskState;
        }
        if (oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
          ABI41_0_0RNUpdateLayoutMetricsMountInstruction(mutation, registry);
          mask |= ABI41_0_0RNComponentViewUpdateMaskLayoutMetrics;
        }

        if (mask != ABI41_0_0RNComponentViewUpdateMaskNone) {
          ABI41_0_0RNFinalizeUpdatesMountInstruction(mutation, mask, registry);
        }

        break;
      }
    }
  }
  [CATransaction commit];
}

@implementation ABI41_0_0RCTMountingManager {
  ABI41_0_0RCTMountingTransactionObserverCoordinator _observerCoordinator;
  BOOL _transactionInFlight;
  BOOL _followUpTransactionRequired;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [[ABI41_0_0RCTComponentViewRegistry alloc] init];
  }

  return self;
}

- (void)scheduleTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  if (ABI41_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to do expensive copy of all mutations;
    // * No need to allocate a block.
    [self initiateTransaction:mountingCoordinator];
    return;
  }

  auto mountingCoordinatorCopy = mountingCoordinator;
  ABI41_0_0RCTExecuteOnMainQueue(^{
    ABI41_0_0RCTAssertMainQueue();
    [self initiateTransaction:mountingCoordinatorCopy];
  });
}

- (void)dispatchCommand:(ABI41_0_0ReactTag)ABI41_0_0ReactTag commandName:(NSString *)commandName args:(NSArray *)args
{
  if (ABI41_0_0RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchCommandOnUIThread:ABI41_0_0ReactTag commandName:commandName args:args];
    return;
  }

  ABI41_0_0RCTExecuteOnMainQueue(^{
    ABI41_0_0RCTAssertMainQueue();
    [self synchronouslyDispatchCommandOnUIThread:ABI41_0_0ReactTag commandName:commandName args:args];
  });
}

- (void)initiateTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  SystraceSection s("-[ABI41_0_0RCTMountingManager initiateTransaction:]");
  ABI41_0_0RCTAssertMainQueue();

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
  SystraceSection s("-[ABI41_0_0RCTMountingManager performTransaction:]");
  ABI41_0_0RCTAssertMainQueue();

  auto transaction = mountingCoordinator->pullTransaction(DifferentiatorMode::Classic);
  if (!transaction.has_value()) {
    return;
  }

  auto surfaceId = transaction->getSurfaceId();
  auto &mutations = transaction->getMutations();

  if (mutations.size() == 0) {
    return;
  }

  auto telemetry = transaction->getTelemetry();
  auto number = transaction->getNumber();

  [self.delegate mountingManager:self willMountComponentsWithRootTag:surfaceId];
  _observerCoordinator.notifyObserversMountingTransactionWillMount({surfaceId, number, telemetry});
  telemetry.willMount();
  ABI41_0_0RNPerformMountInstructions(mutations, self.componentViewRegistry, _observerCoordinator, surfaceId);
  telemetry.didMount();
  _observerCoordinator.notifyObserversMountingTransactionDidMount({surfaceId, number, telemetry});
  [self.delegate mountingManager:self didMountComponentsWithRootTag:surfaceId];
}

- (void)synchronouslyUpdateViewOnUIThread:(ABI41_0_0ReactTag)ABI41_0_0ReactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ComponentDescriptor &)componentDescriptor
{
  ABI41_0_0RCTAssertMainQueue();
  UIView<ABI41_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI41_0_0ReactTag];
  SharedProps oldProps = [componentView props];
  SharedProps newProps = componentDescriptor.cloneProps(oldProps, RawProps(convertIdToFollyDynamic(props)));
  [componentView updateProps:newProps oldProps:oldProps];
}

- (void)synchronouslyDispatchCommandOnUIThread:(ABI41_0_0ReactTag)ABI41_0_0ReactTag
                                   commandName:(NSString *)commandName
                                          args:(NSArray *)args
{
  ABI41_0_0RCTAssertMainQueue();
  UIView<ABI41_0_0RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:ABI41_0_0ReactTag];
  [componentView handleCommand:commandName args:args];
}

@end
