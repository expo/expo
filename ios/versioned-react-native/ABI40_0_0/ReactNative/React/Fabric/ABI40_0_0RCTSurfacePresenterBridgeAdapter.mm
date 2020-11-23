/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTSurfacePresenterBridgeAdapter.h"

#import <ABI40_0_0cxxreact/ABI40_0_0MessageQueueThread.h>
#import <ABI40_0_0jsi/ABI40_0_0jsi.h>

#import <ABI40_0_0React/ABI40_0_0RCTAssert.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridge+Private.h>
#import <ABI40_0_0React/ABI40_0_0RCTImageLoader.h>
#import <ABI40_0_0React/ABI40_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI40_0_0React/ABI40_0_0RCTSurfacePresenter.h>
#import <ABI40_0_0React/ABI40_0_0RCTSurfacePresenterStub.h>

#import <ABI40_0_0React/utils/ContextContainer.h>
#import <ABI40_0_0React/utils/ManagedObjectWrapper.h>
#import <ABI40_0_0React/utils/RuntimeExecutor.h>

using namespace ABI40_0_0facebook::ABI40_0_0React;

@interface ABI40_0_0RCTBridge ()
- (std::shared_ptr<ABI40_0_0facebook::ABI40_0_0React::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

static ContextContainer::Shared ABI40_0_0RCTContextContainerFromBridge(ABI40_0_0RCTBridge *bridge)
{
  auto contextContainer = std::make_shared<ContextContainer const>();

  ABI40_0_0RCTImageLoader *imageLoader = ABI40_0_0RCTTurboModuleEnabled()
      ? [bridge moduleForName:@"ABI40_0_0RCTImageLoader" lazilyLoadIfNecessary:YES]
      : [bridge moduleForClass:[ABI40_0_0RCTImageLoader class]];

  contextContainer->insert("Bridge", wrapManagedObjectWeakly(bridge));
  contextContainer->insert("ABI40_0_0RCTImageLoader", wrapManagedObject((id<ABI40_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader));
  return contextContainer;
}

static RuntimeExecutor ABI40_0_0RCTRuntimeExecutorFromBridge(ABI40_0_0RCTBridge *bridge)
{
  auto bridgeWeakWrapper = wrapManagedObjectWeakly([bridge batchedBridge] ?: bridge);

  RuntimeExecutor runtimeExecutor = [bridgeWeakWrapper](
                                        std::function<void(ABI40_0_0facebook::jsi::Runtime & runtime)> &&callback) {
    [unwrapManagedObjectWeakly(bridgeWeakWrapper) invokeAsync:[bridgeWeakWrapper, callback = std::move(callback)]() {
      ABI40_0_0RCTCxxBridge *batchedBridge = (ABI40_0_0RCTCxxBridge *)unwrapManagedObjectWeakly(bridgeWeakWrapper);

      if (!batchedBridge) {
        return;
      }

      auto runtime = (ABI40_0_0facebook::jsi::Runtime *)(batchedBridge.runtime);

      if (!runtime) {
        return;
      }

      callback(*runtime);
    }];
  };

  return runtimeExecutor;
}

@implementation ABI40_0_0RCTSurfacePresenterBridgeAdapter {
  ABI40_0_0RCTSurfacePresenter *_Nullable _surfacePresenter;
  __weak ABI40_0_0RCTBridge *_bridge;
  __weak ABI40_0_0RCTBridge *_batchedBridge;
}

- (instancetype)initWithBridge:(ABI40_0_0RCTBridge *)bridge contextContainer:(ContextContainer::Shared)contextContainer
{
  if (self = [super init]) {
    contextContainer->update(*ABI40_0_0RCTContextContainerFromBridge(bridge));
    _surfacePresenter = [[ABI40_0_0RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                              runtimeExecutor:ABI40_0_0RCTRuntimeExecutorFromBridge(bridge)];

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

- (ABI40_0_0RCTBridge *)bridge
{
  return _bridge;
}

- (void)setBridge:(ABI40_0_0RCTBridge *)bridge
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
  _surfacePresenter.runtimeExecutor = ABI40_0_0RCTRuntimeExecutorFromBridge(_bridge);
  _surfacePresenter.contextContainer->update(*ABI40_0_0RCTContextContainerFromBridge(_bridge));

  [_bridge setSurfacePresenter:_surfacePresenter];
  [_batchedBridge setSurfacePresenter:_surfacePresenter];
}

- (void)_addBridgeObservers:(ABI40_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillReloadNotification:)
                                               name:ABI40_0_0RCTBridgeWillReloadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:ABI40_0_0RCTJavaScriptDidLoadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillBeInvalidatedNotification:)
                                               name:ABI40_0_0RCTBridgeWillBeInvalidatedNotification
                                             object:bridge];
}

- (void)_removeBridgeObservers:(ABI40_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI40_0_0RCTBridgeWillReloadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI40_0_0RCTJavaScriptDidLoadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI40_0_0RCTBridgeWillBeInvalidatedNotification object:bridge];
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
  ABI40_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
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
