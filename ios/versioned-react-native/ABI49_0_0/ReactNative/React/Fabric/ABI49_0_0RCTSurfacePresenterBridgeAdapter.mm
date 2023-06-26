/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTSurfacePresenterBridgeAdapter.h"

#import <ABI49_0_0cxxreact/ABI49_0_0MessageQueueThread.h>
#import <ABI49_0_0jsi/ABI49_0_0jsi.h>

#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTConstants.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTRuntimeExecutorFromBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenter.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterStub.h>

#import <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#import <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>
#import <ABI49_0_0React/utils/ABI49_0_0ManagedObjectWrapper.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;

@interface ABI49_0_0RCTBridge ()
- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::MessageQueueThread>)jsMessageThread;
- (void)invokeAsync:(std::function<void()> &&)func;
@end

static ContextContainer::Shared ABI49_0_0RCTContextContainerFromBridge(ABI49_0_0RCTBridge *bridge)
{
  auto contextContainer = std::make_shared<ContextContainer const>();

  ABI49_0_0RCTImageLoader *imageLoader = ABI49_0_0RCTTurboModuleEnabled()
      ? [bridge moduleForName:@"ABI49_0_0RCTImageLoader" lazilyLoadIfNecessary:YES]
      : [bridge moduleForClass:[ABI49_0_0RCTImageLoader class]];

  contextContainer->insert("Bridge", wrapManagedObjectWeakly(bridge));
  contextContainer->insert("ABI49_0_0RCTImageLoader", wrapManagedObject((id<ABI49_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader));
  return contextContainer;
}

@implementation ABI49_0_0RCTSurfacePresenterBridgeAdapter {
  ABI49_0_0RCTSurfacePresenter *_Nullable _surfacePresenter;
  __weak ABI49_0_0RCTBridge *_bridge;
  __weak ABI49_0_0RCTBridge *_batchedBridge;
}

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge contextContainer:(ContextContainer::Shared)contextContainer
{
  if (self = [super init]) {
    contextContainer->update(*ABI49_0_0RCTContextContainerFromBridge(bridge));
    _surfacePresenter = [[ABI49_0_0RCTSurfacePresenter alloc] initWithContextContainer:contextContainer
                                                              runtimeExecutor:ABI49_0_0RCTRuntimeExecutorFromBridge(bridge)
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

- (ABI49_0_0RCTBridge *)bridge
{
  return _bridge;
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
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
  _surfacePresenter.runtimeExecutor = ABI49_0_0RCTRuntimeExecutorFromBridge(_bridge);
  _surfacePresenter.contextContainer->update(*ABI49_0_0RCTContextContainerFromBridge(_bridge));

  [_bridge setSurfacePresenter:_surfacePresenter];
  [_batchedBridge setSurfacePresenter:_surfacePresenter];
}

- (void)_addBridgeObservers:(ABI49_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillReloadNotification:)
                                               name:ABI49_0_0RCTBridgeWillReloadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:ABI49_0_0RCTJavaScriptDidLoadNotification
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleBridgeWillBeInvalidatedNotification:)
                                               name:ABI49_0_0RCTBridgeWillBeInvalidatedNotification
                                             object:bridge];
}

- (void)_removeBridgeObservers:(ABI49_0_0RCTBridge *)bridge
{
  if (!bridge) {
    return;
  }

  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI49_0_0RCTBridgeWillReloadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI49_0_0RCTJavaScriptDidLoadNotification object:bridge];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI49_0_0RCTBridgeWillBeInvalidatedNotification object:bridge];
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
  ABI49_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
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
