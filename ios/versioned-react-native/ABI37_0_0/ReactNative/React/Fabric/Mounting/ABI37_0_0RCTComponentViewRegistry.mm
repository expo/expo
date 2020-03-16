/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <ABI37_0_0React/ABI37_0_0RCTAssert.h>

#import "ABI37_0_0RCTImageComponentView.h"
#import "ABI37_0_0RCTParagraphComponentView.h"
#import "ABI37_0_0RCTViewComponentView.h"

using namespace ABI37_0_0facebook::ABI37_0_0React;

#define LEGACY_UIMANAGER_INTEGRATION_ENABLED 1

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED

#import <ABI37_0_0React/ABI37_0_0RCTBridge+Private.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>

/**
 * Warning: This is a total hack and temporary solution.
 * Unless we have a pure Fabric-based implementation of UIManager commands
 * delivery pipeline, we have to leverage existing infra. This code tricks
 * legacy UIManager by registering all Fabric-managed views in it,
 * hence existing command-delivery infra can reach "foreign" views using
 * the old pipeline.
 */
@interface ABI37_0_0RCTUIManager ()
- (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry;
@end

@interface ABI37_0_0RCTUIManager (Hack)

+ (void)registerView:(UIView *)view;
+ (void)unregisterView:(UIView *)view;

@end

@implementation ABI37_0_0RCTUIManager (Hack)

+ (void)registerView:(UIView *)view
{
  if (!view) {
    return;
  }

  ABI37_0_0RCTUIManager *uiManager = [[ABI37_0_0RCTBridge currentBridge] uiManager];
  view.ABI37_0_0ReactTag = @(view.tag);
  [uiManager.viewRegistry setObject:view forKey:@(view.tag)];
}

+ (void)unregisterView:(UIView *)view
{
  if (!view) {
    return;
  }

  ABI37_0_0RCTUIManager *uiManager = [[ABI37_0_0RCTBridge currentBridge] uiManager];
  view.ABI37_0_0ReactTag = nil;
  [uiManager.viewRegistry removeObjectForKey:@(view.tag)];
}

@end

#endif

const NSInteger ABI37_0_0RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation ABI37_0_0RCTComponentViewRegistry {
  NSMapTable<id /* ABI37_0_0ReactTag */, UIView<ABI37_0_0RCTComponentViewProtocol> *> *_registry;
  NSMapTable<id /* ComponentHandle */, NSHashTable<UIView<ABI37_0_0RCTComponentViewProtocol> *> *> *_recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality];
    _recyclePool =
        [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsOpaquePersonality | NSPointerFunctionsOpaqueMemory
                              valueOptions:NSPointerFunctionsObjectPersonality];
    _componentViewFactory = [ABI37_0_0RCTComponentViewFactory standardComponentViewFactory];

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
      {[ABI37_0_0RCTViewComponentView componentDescriptorProvider].handle, 1},
      {[ABI37_0_0RCTImageComponentView componentDescriptorProvider].handle, 0.3},
      {[ABI37_0_0RCTParagraphComponentView componentDescriptorProvider].handle, 0.3},
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

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView<ABI37_0_0RCTComponentViewProtocol> *)dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                                                          tag:(ABI37_0_0ReactTag)tag
{
  ABI37_0_0RCTAssertMainQueue();

  ABI37_0_0RCTAssert(
      ![_registry objectForKey:(__bridge id)(void *)tag],
      @"ABI37_0_0RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  UIView<ABI37_0_0RCTComponentViewProtocol> *componentView = [self _dequeueComponentViewWithComponentHandle:componentHandle];
  componentView.tag = tag;
  [_registry setObject:componentView forKey:(__bridge id)(void *)tag];

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [ABI37_0_0RCTUIManager registerView:componentView];
#endif

  return componentView;
}

- (void)enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                            tag:(ABI37_0_0ReactTag)tag
                                  componentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)componentView
{
  ABI37_0_0RCTAssertMainQueue();

  ABI37_0_0RCTAssert(
      [_registry objectForKey:(__bridge id)(void *)tag],
      @"ABI37_0_0RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [ABI37_0_0RCTUIManager unregisterView:componentView];
#endif

  [_registry removeObjectForKey:(__bridge id)(void *)tag];
  componentView.tag = 0;
  [self _enqueueComponentViewWithComponentHandle:componentHandle componentView:componentView];
}

- (void)optimisticallyCreateComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  ABI37_0_0RCTAssertMainQueue();
  [self _enqueueComponentViewWithComponentHandle:componentHandle
                                   componentView:[self.componentViewFactory
                                                     createComponentViewWithComponentHandle:componentHandle]];
}

- (UIView<ABI37_0_0RCTComponentViewProtocol> *)componentViewByTag:(ABI37_0_0ReactTag)tag
{
  ABI37_0_0RCTAssertMainQueue();
  return [_registry objectForKey:(__bridge id)(void *)tag];
}

- (ABI37_0_0ReactTag)tagByComponentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)componentView
{
  ABI37_0_0RCTAssertMainQueue();
  return componentView.tag;
}

- (nullable UIView<ABI37_0_0RCTComponentViewProtocol> *)_dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  ABI37_0_0RCTAssertMainQueue();
  NSHashTable<UIView<ABI37_0_0RCTComponentViewProtocol> *> *componentViews =
      [_recyclePool objectForKey:(__bridge id)(void *)componentHandle];
  if (!componentViews || componentViews.count == 0) {
    return [self.componentViewFactory createComponentViewWithComponentHandle:componentHandle];
  }

  UIView<ABI37_0_0RCTComponentViewProtocol> *componentView = [componentViews anyObject];
  [componentViews removeObject:componentView];
  return componentView;
}

- (void)_enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                   componentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)componentView
{
  ABI37_0_0RCTAssertMainQueue();
  NSHashTable<UIView<ABI37_0_0RCTComponentViewProtocol> *> *componentViews =
      [_recyclePool objectForKey:(__bridge id)(void *)componentHandle];
  if (!componentViews) {
    componentViews = [NSHashTable hashTableWithOptions:NSPointerFunctionsObjectPersonality];
    [_recyclePool setObject:componentViews forKey:(__bridge id)(void *)componentHandle];
  }

  if (componentViews.count >= ABI37_0_0RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  [componentView prepareForRecycle];
  [componentViews addObject:componentView];
}

- (void)handleApplicationDidReceiveMemoryWarningNotification
{
  [_recyclePool removeAllObjects];
}

@end
