/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSurfacePresenterBridgeAdapter.h"

#import <ABI48_0_0cxxreact/ABI48_0_0MessageQueueThread.h>
#import <ABI48_0_0jsi/ABI48_0_0jsi.h>

#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>
#import <ABI48_0_0React/ABI48_0_0RCTConstants.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageLoader.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfacePresenter.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfacePresenterStub.h>

#import <ABI48_0_0ReactCommon/ABI48_0_0RuntimeExecutor.h>
#import <ABI48_0_0React/ABI48_0_0utils/ContextContainer.h>
#import <ABI48_0_0React/ABI48_0_0utils/ManagedObjectWrapper.h>

using namespace ABI48_0_0facebook::ABI48_0_0React;

@interface ABI48_0_0RCTBridge ()
- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

static ContextContainer::Shared ABI48_0_0RCTContextContainerFromBridge(ABI48_0_0RCTBridge *bridge)
{
  auto contextContainer = std::make_shared<ContextContainer const>();

  ABI48_0_0RCTImageLoader *imageLoader = ABI48_0_0RCTTurboModuleEnabled()
      ? [bridge moduleForName:@"ABI48_0_0RCTImageLoader" lazilyLoadIfNecessary:YES]
      : [bridge moduleForClass:[ABI48_0_0RCTImageLoader class]];

  contextContainer->insert("Bridge", wrapManagedObjectWeakly(bridge));
  contextContainer->insert("ABI48_0_0RCTImageLoader", wrapManagedObject((id<ABI48_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader));
  return contextContainer;
}

RuntimeExecutor ABI48_0_0RCTRuntimeExecutorFromBridge(ABI48_0_0RCTBridge *bridge)
{
  ABI48_0_0RCTAssert(bridge, @"ABI48_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil.");

  auto bridgeWeakWrapper = wrapManagedObjectWeakly([bridge batchedBridge] ?: bridge);

  RuntimeExecutor runtimeExecutor = [bridgeWeakWrapper](
                                        std::function<void(ABI48_0_0facebook::jsi::Runtime & runtime)> &&callback) {
    ABI48_0_0RCTBridge *bridge = unwrapManagedObjectWeakly(bridgeWeakWrapper);

    ABI48_0_0RCTAssert(bridge, @"ABI48_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of scheduling a call.");

    [bridge invokeAsync:[bridgeWeakWrapper, callback = std::move(callback)]() {
      ABI48_0_0RCTCxxBridge *batchedBridge = (ABI48_0_0RCTCxxBridge *)unwrapManagedObjectWeakly(bridgeWeakWrapper);

      ABI48_0_0RCTAssert(batchedBridge, @"ABI48_0_0RCTRuntimeExecutorFromBridge: Bridge must not be nil at the moment of invocation.");

      if (!batchedBridge) {
        return;
      }

      auto runtime = (ABI48_0_0facebook::jsi::Runtime *)(batchedBridge.runtime);

      ABI48_0_0RCTAssert(
          runtime, @"ABI48_0_0RCTRuntimeExecutorFromBridge: Bridge must have a valid jsi::Runtime at the moment of invocation.");

      if (!runtime) {
        return;
      }

      callback(*runtime);
    }];
  };

  return runtimeExecutor;
}

@implementation ABI48_0_0RCTSurfacePresenterBridgeAdapter {
  ABI48_0_0RCTSurfacePresenter *_Nullable _surfacePresenter;
  __weak ABI48_0_0RCTBridge *_bridge;
  __weak ABI48_0_0RCTBridge *_batchedBridge;
}

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge contextContainer:(ContextContainer::Shared)contextContainer
{
  if (self = [super init]) {
    contextContainer->update(*ABI48_0_0RCTContextContainerFromBridge(bridge));
    _surfacePresenter = [[ABI48_0_0RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                              runtimeExecutor:ABI48_0_0RCTRuntimeExecutorFromBridge(bridge)
                                                   bridgelessBindingsExecutor:std::nullopt];

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

- (ABI48_0_0RCTBridge *)bridge
{
  return _bridge;
}

- (void)setBridge:(ABI48_0_0RCTBridge *)bridge
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
  _surfacePresenter.runtimeExecutor = ABI48_0_0RCTRuntimeExecutorFromBridge(_bridge);
  _surfacePresenter.contextContainer->update(*ABI48_0_0RCTContextContainerFromBridge(_bridge));

  [_bridge setSurfacePresenter:_surfacePresenter];
  [_batchedBridge setSurfacePresenter:_surfacePresenter];
}

- (void)_addBridgeObservers:(ABI48_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillReloadNotification:)
                                               name:ABI48_0_0RCTBridgeWillReloadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:ABI48_0_0RCTJavaScriptDidLoadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillBeInvalidatedNotification:)
                                               name:ABI48_0_0RCTBridgeWillBeInvalidatedNotification
                                             object:bridge];
}

- (void)_removeBridgeObservers:(ABI48_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI48_0_0RCTBridgeWillReloadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI48_0_0RCTJavaScriptDidLoadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI48_0_0RCTBridgeWillBeInvalidatedNotification object:bridge];
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
  ABI48_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
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
