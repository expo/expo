/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <ABI41_0_0React/ABI41_0_0RCTAssert.h>

#import "ABI41_0_0RCTImageComponentView.h"
#import "ABI41_0_0RCTParagraphComponentView.h"
#import "ABI41_0_0RCTViewComponentView.h"

#import <better/map.h>

using namespace ABI41_0_0facebook::ABI41_0_0React;

#define LEGACY_UIMANAGER_INTEGRATION_ENABLED 1

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED

#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>

/**
 * Warning: This is a total hack and temporary solution.
 * Unless we have a pure Fabric-based implementation of UIManager commands
 * delivery pipeline, we have to leverage existing infra. This code tricks
 * legacy UIManager by registering all Fabric-managed views in it,
 * hence existing command-delivery infra can reach "foreign" views using
 * the old pipeline.
 */
@interface ABI41_0_0RCTUIManager ()
- (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry;
@end

@interface ABI41_0_0RCTUIManager (Hack)

+ (void)registerView:(UIView *)view;
+ (void)unregisterView:(UIView *)view;

@end

@implementation ABI41_0_0RCTUIManager (Hack)

+ (void)registerView:(UIView *)view
{
  if (!view) {
    return;
  }

  ABI41_0_0RCTUIManager *uiManager = [[ABI41_0_0RCTBridge currentBridge] uiManager];
  view.ABI41_0_0ReactTag = @(view.tag);
  [uiManager.viewRegistry setObject:view forKey:@(view.tag)];
}

+ (void)unregisterView:(UIView *)view
{
  if (!view) {
    return;
  }

  ABI41_0_0RCTUIManager *uiManager = [[ABI41_0_0RCTBridge currentBridge] uiManager];
  view.ABI41_0_0ReactTag = nil;
  [uiManager.viewRegistry removeObjectForKey:@(view.tag)];
}

@end

#endif

const NSInteger ABI41_0_0RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation ABI41_0_0RCTComponentViewRegistry {
  better::map<Tag, ABI41_0_0RCTComponentViewDescriptor> _registry;
  better::map<ComponentHandle, std::vector<ABI41_0_0RCTComponentViewDescriptor>> _recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewFactory = [ABI41_0_0RCTComponentViewFactory standardComponentViewFactory];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleApplicationDidReceiveMemoryWarningNotification)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      // Calling this a bit later, when the main thread is probably idle while JavaScript thread is busy.
      [self preallocateViewComponents];
    });
  }

  return self;
}

- (void)preallocateViewComponents
{
  // This data is based on empirical evidence which should represent the reality pretty well.
  // Regular `<View>` has magnitude equals to `1` by definition.
  std::vector<std::pair<ComponentHandle, float>> componentMagnitudes = {
      {[ABI41_0_0RCTViewComponentView componentDescriptorProvider].handle, 1},
      {[ABI41_0_0RCTImageComponentView componentDescriptorProvider].handle, 0.3},
      {[ABI41_0_0RCTParagraphComponentView componentDescriptorProvider].handle, 0.3},
  };

  // `complexity` represents the complexity of a typical surface in a number of `<View>` components (with Flattening
  // enabled).
  float complexity = 100;

  // The whole process should not take more than 10ms in the worst case, so there is no need to split it up.
  for (const auto &componentMagnitude : componentMagnitudes) {
    for (int i = 0; i < complexity * componentMagnitude.second; i++) {
      [self optimisticallyCreateComponentViewWithComponentHandle:componentMagnitude.first];
    }
  }
}

- (ABI41_0_0RCTComponentViewDescriptor)dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle tag:(Tag)tag
{
  ABI41_0_0RCTAssertMainQueue();

  ABI41_0_0RCTAssert(
      _registry.find(tag) == _registry.end(),
      @"ABI41_0_0RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  auto componentViewDescriptor = [self _dequeueComponentViewWithComponentHandle:componentHandle];
  componentViewDescriptor.view.tag = tag;

  _registry.insert({tag, componentViewDescriptor});

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [ABI41_0_0RCTUIManager registerView:componentViewDescriptor.view];
#endif

  return componentViewDescriptor;
}

- (void)enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                            tag:(Tag)tag
                        componentViewDescriptor:(ABI41_0_0RCTComponentViewDescriptor)componentViewDescriptor
{
  ABI41_0_0RCTAssertMainQueue();

  ABI41_0_0RCTAssert(
      _registry.find(tag) != _registry.end(), @"ABI41_0_0RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [ABI41_0_0RCTUIManager unregisterView:componentViewDescriptor.view];
#endif

  _registry.erase(tag);
  componentViewDescriptor.view.tag = 0;
  [self _enqueueComponentViewWithComponentHandle:componentHandle componentViewDescriptor:componentViewDescriptor];
}

- (void)optimisticallyCreateComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  ABI41_0_0RCTAssertMainQueue();
  [self _enqueueComponentViewWithComponentHandle:componentHandle
                         componentViewDescriptor:[self.componentViewFactory
                                                     createComponentViewWithComponentHandle:componentHandle]];
}

- (ABI41_0_0RCTComponentViewDescriptor const &)componentViewDescriptorWithTag:(Tag)tag
{
  ABI41_0_0RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  ABI41_0_0RCTAssert(iterator != _registry.end(), @"ABI41_0_0RCTComponentViewRegistry: Attempt to query unregistered component.");
  return iterator->second;
}

- (nullable UIView<ABI41_0_0RCTComponentViewProtocol> *)findComponentViewWithTag:(Tag)tag
{
  ABI41_0_0RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  if (iterator == _registry.end()) {
    return nil;
  }
  return iterator->second.view;
}

- (ABI41_0_0RCTComponentViewDescriptor)_dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  ABI41_0_0RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.size() == 0) {
    return [self.componentViewFactory createComponentViewWithComponentHandle:componentHandle];
  }

  auto componentViewDescriptor = recycledViews.back();
  recycledViews.pop_back();
  return componentViewDescriptor;
}

- (void)_enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                         componentViewDescriptor:(ABI41_0_0RCTComponentViewDescriptor)componentViewDescriptor
{
  ABI41_0_0RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.size() > ABI41_0_0RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  [componentViewDescriptor.view prepareForRecycle];

  recycledViews.push_back(componentViewDescriptor);
}

- (void)handleApplicationDidReceiveMemoryWarningNotification
{
  _recyclePool.clear();
}

@end
