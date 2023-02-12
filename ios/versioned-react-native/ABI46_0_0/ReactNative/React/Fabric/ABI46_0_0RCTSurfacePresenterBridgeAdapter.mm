/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTSurfacePresenterBridgeAdapter.h"

#import <ABI46_0_0cxxreact/ABI46_0_0MessageQueueThread.h>
#import <ABI46_0_0jsi/ABI46_0_0jsi.h>

#import <ABI46_0_0React/ABI46_0_0RCTAssert.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridge+Private.h>
#import <ABI46_0_0React/ABI46_0_0RCTImageLoader.h>
#import <ABI46_0_0React/ABI46_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI46_0_0React/ABI46_0_0RCTSurfacePresenter.h>
#import <ABI46_0_0React/ABI46_0_0RCTSurfacePresenterStub.h>

#import <ABI46_0_0ReactCommon/ABI46_0_0RuntimeExecutor.h>
#import <ABI46_0_0React/ABI46_0_0utils/ContextContainer.h>
#import <ABI46_0_0React/ABI46_0_0utils/ManagedObjectWrapper.h>

using namespace ABI46_0_0facebook::ABI46_0_0React;

@interface ABI46_0_0RCTBridge ()
- (std::shared_ptr<ABI46_0_0facebook::ABI46_0_0React::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

static ContextContainer::Shared ABI46_0_0RCTContextContainerFromBridge(ABI46_0_0RCTBridge *bridge)
{
  auto contextContainer = std::make_shared<ContextContainer const>();

  ABI46_0_0RCTImageLoader *imageLoader = ABI46_0_0RCTTurboModuleEnabled()
      ? [bridge moduleForName:@"ABI46_0_0RCTImageLoader" lazilyLoadIfNecessary:YES]
      : [bridge moduleForClass:[ABI46_0_0RCTImageLoader class]];

  contextContainer->insert("Bridge", wrapManagedObjectWeakly(bridge));
  contextContainer->insert("ABI46_0_0RCTImageLoader", wrapManagedObject((id<ABI46_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader));
  return contextContainer;
}

RuntimeExecutor ABI46_0_0RCTRuntimeExecutorFromBridge(ABI46_0_0RCTBridge *bridge)
{
  ABI46_0_0RCTAssert(bridge, @"ABI46_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil.");

  auto bridgeWeakWrapper = wrapManagedObjectWeakly([bridge batchedBridge] ?: bridge);

  RuntimeExecutor runtimeExecutor = [bridgeWeakWrapper](
                                        std::function<void(ABI46_0_0facebook::jsi::Runtime & runtime)> &&callback) {
    ABI46_0_0RCTBridge *bridge = unwrapManagedObjectWeakly(bridgeWeakWrapper);

    ABI46_0_0RCTAssert(bridge, @"ABI46_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of scheduling a call.");

    [bridge invokeAsync:[bridgeWeakWrapper, callback = std::move(callback)]() {
      ABI46_0_0RCTCxxBridge *batchedBridge = (ABI46_0_0RCTCxxBridge *)unwrapManagedObjectWeakly(bridgeWeakWrapper);

      ABI46_0_0RCTAssert(batchedBridge, @"ABI46_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of invocation.");

      if (!batchedBridge) {
        return;
      }

      auto runtime = (ABI46_0_0facebook::jsi::Runtime *)(batchedBridge.runtime);

      ABI46_0_0RCTAssert(
          runtime, @"ABI46_0_0RCTRuntimeExecutorFromBridge: Bridge must have a valid jsi::Runtime at the moment of invocation.");

      if (!runtime) {
        return;
      }

      callback(*runtime);
    }];
  };

  return runtimeExecutor;
}

@implementation ABI46_0_0RCTSurfacePresenterBridgeAdapter {
  ABI46_0_0RCTSurfacePresenter *_Nullable _surfacePresenter;
  __weak ABI46_0_0RCTBridge *_bridge;
  __weak ABI46_0_0RCTBridge *_batchedBridge;
}

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge contextContainer:(ContextContainer::Shared)contextContainer
{
  if (self = [super init]) {
    contextContainer->update(*ABI46_0_0RCTContextContainerFromBridge(bridge));
    _surfacePresenter = [[ABI46_0_0RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                              runtimeExecutor:ABI46_0_0RCTRuntimeExecutorFromBridge(bridge)];

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

- (ABI46_0_0RCTBridge *)bridge
{
  return _bridge;
}

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge
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
  _surfacePresenter.runtimeExecutor = ABI46_0_0RCTRuntimeExecutorFromBridge(_bridge);
  _surfacePresenter.contextContainer->update(*ABI46_0_0RCTContextContainerFromBridge(_bridge));

  [_bridge setSurfacePresenter:_surfacePresenter];
  [_batchedBridge setSurfacePresenter:_surfacePresenter];
}

- (void)_addBridgeObservers:(ABI46_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillReloadNotification:)
                                               name:ABI46_0_0RCTBridgeWillReloadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:ABI46_0_0RCTJavaScriptDidLoadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillBeInvalidatedNotification:)
                                               name:ABI46_0_0RCTBridgeWillBeInvalidatedNotification
                                             object:bridge];
}

- (void)_removeBridgeObservers:(ABI46_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI46_0_0RCTBridgeWillReloadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI46_0_0RCTJavaScriptDidLoadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI46_0_0RCTBridgeWillBeInvalidatedNotification object:bridge];
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
  ABI46_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
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
