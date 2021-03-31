/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSurfacePresenterBridgeAdapter.h"

#import <ABI41_0_0cxxreact/ABI41_0_0MessageQueueThread.h>
#import <ABI41_0_0jsi/ABI41_0_0jsi.h>

#import <ABI41_0_0React/ABI41_0_0RCTAssert.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageLoader.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfacePresenter.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfacePresenterStub.h>

#import <ABI41_0_0React/utils/ContextContainer.h>
#import <ABI41_0_0React/utils/ManagedObjectWrapper.h>
#import <ABI41_0_0React/utils/RuntimeExecutor.h>

using namespace ABI41_0_0facebook::ABI41_0_0React;

@interface ABI41_0_0RCTBridge ()
- (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

static ContextContainer::Shared ABI41_0_0RCTContextContainerFromBridge(ABI41_0_0RCTBridge *bridge)
{
  auto contextContainer = std::make_shared<ContextContainer const>();

  ABI41_0_0RCTImageLoader *imageLoader = ABI41_0_0RCTTurboModuleEnabled()
      ? [bridge moduleForName:@"ABI41_0_0RCTImageLoader" lazilyLoadIfNecessary:YES]
      : [bridge moduleForClass:[ABI41_0_0RCTImageLoader class]];

  contextContainer->insert("Bridge", wrapManagedObjectWeakly(bridge));
  contextContainer->insert("ABI41_0_0RCTImageLoader", wrapManagedObject((id<ABI41_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader));
  return contextContainer;
}

static RuntimeExecutor ABI41_0_0RCTRuntimeExecutorFromBridge(ABI41_0_0RCTBridge *bridge)
{
  auto bridgeWeakWrapper = wrapManagedObjectWeakly([bridge batchedBridge] ?: bridge);

  RuntimeExecutor runtimeExecutor = [bridgeWeakWrapper](
                                        std::function<void(ABI41_0_0facebook::jsi::Runtime & runtime)> &&callback) {
    [unwrapManagedObjectWeakly(bridgeWeakWrapper) invokeAsync:[bridgeWeakWrapper, callback = std::move(callback)]() {
      ABI41_0_0RCTCxxBridge *batchedBridge = (ABI41_0_0RCTCxxBridge *)unwrapManagedObjectWeakly(bridgeWeakWrapper);

      if (!batchedBridge) {
        return;
      }

      auto runtime = (ABI41_0_0facebook::jsi::Runtime *)(batchedBridge.runtime);

      if (!runtime) {
        return;
      }

      callback(*runtime);
    }];
  };

  return runtimeExecutor;
}

@implementation ABI41_0_0RCTSurfacePresenterBridgeAdapter {
  ABI41_0_0RCTSurfacePresenter *_Nullable _surfacePresenter;
  __weak ABI41_0_0RCTBridge *_bridge;
  __weak ABI41_0_0RCTBridge *_batchedBridge;
}

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge contextContainer:(ContextContainer::Shared)contextContainer
{
  if (self = [super init]) {
    contextContainer->update(*ABI41_0_0RCTContextContainerFromBridge(bridge));
    _surfacePresenter = [[ABI41_0_0RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                              runtimeExecutor:ABI41_0_0RCTRuntimeExecutorFromBridge(bridge)];

    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    [self _updateSurfacePresenter];
    [self _addBridgeObservers:_bridge];
  }

  return self;
}

- (void)dealloc
{
  [_surfacePresenter suspend];
}

- (ABI41_0_0RCTBridge *)bridge
{
  return _bridge;
}

- (void)setBridge:(ABI41_0_0RCTBridge *)bridge
{
  if (bridge == _bridge) {
    return;
  }

  [self _removeBridgeObservers:_bridge];

  [_surfacePresenter suspend];

  _bridge = bridge;
  _batchedBridge = [_bridge batchedBridge] ?: _bridge;

  [self _updateSurfacePresenter];

  [self _addBridgeObservers:_bridge];

  [_surfacePresenter resume];
}

- (void)_updateSurfacePresenter
{
  _surfacePresenter.runtimeExecutor = ABI41_0_0RCTRuntimeExecutorFromBridge(_bridge);
  _surfacePresenter.contextContainer->update(*ABI41_0_0RCTContextContainerFromBridge(_bridge));

  [_bridge setSurfacePresenter:_surfacePresenter];
  [_batchedBridge setSurfacePresenter:_surfacePresenter];
}

- (void)_addBridgeObservers:(ABI41_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillReloadNotification:)
                                               name:ABI41_0_0RCTBridgeWillReloadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:ABI41_0_0RCTJavaScriptDidLoadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillBeInvalidatedNotification:)
                                               name:ABI41_0_0RCTBridgeWillBeInvalidatedNotification
                                             object:bridge];
}

- (void)_removeBridgeObservers:(ABI41_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI41_0_0RCTBridgeWillReloadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI41_0_0RCTJavaScriptDidLoadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI41_0_0RCTBridgeWillBeInvalidatedNotification object:bridge];
}

#pragma mark - Bridge events

- (void)handleBridgeWillReloadNotification:(NSNotification *)notification
{
  [_surfacePresenter suspend];
}

- (void)handleBridgeWillBeInvalidatedNotification:(NSNotification *)notification
{
  [_surfacePresenter suspend];
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  ABI41_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge == _batchedBridge) {
    // Nothing really changed.
    return;
  }

  _batchedBridge = bridge;
  _batchedBridge.surfacePresenter = _surfacePresenter;

  [self _updateSurfacePresenter];

  [_surfacePresenter resume];
}

@end
