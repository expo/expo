/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <ReactABI31_0_0/ABI31_0_0RCTAssert.h>

#define LEGACY_UIMANAGER_INTEGRATION_ENABLED 1

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED

#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTBridge+Private.h>

/**
 * Warning: This is a total hack and temporary solution.
 * Unless we have a pure Fabric-based implementation of UIManager commands
 * delivery pipeline, we have to leverage existing infra. This code tricks
 * legacy UIManager by registering all Fabric-managed views in it,
 * hence existing command-delivery infra can reach "foreign" views using
 * the old pipeline.
 */
@interface ABI31_0_0RCTUIManager ()
- (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry;
@end

@interface ABI31_0_0RCTUIManager (Hack)

+ (void)registerView:(UIView *)view;
+ (void)unregisterView:(UIView *)view;

@end

@implementation ABI31_0_0RCTUIManager (Hack)

+ (void)registerView:(UIView *)view
{
  if (!view) {
    return;
  }

  ABI31_0_0RCTUIManager *uiManager = [[ABI31_0_0RCTBridge currentBridge] uiManager];
  view.ReactABI31_0_0Tag = @(view.tag);
  [uiManager.viewRegistry setObject:view forKey:@(view.tag)];
}

+ (void)unregisterView:(UIView *)view
{
  if (!view) {
    return;
  }

  ABI31_0_0RCTUIManager *uiManager = [[ABI31_0_0RCTBridge currentBridge] uiManager];
  view.ReactABI31_0_0Tag = nil;
  [uiManager.viewRegistry removeObjectForKey:@(view.tag)];
}

@end

#endif

const NSInteger ABI31_0_0RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation ABI31_0_0RCTComponentViewRegistry {
  NSMapTable<id, UIView<ABI31_0_0RCTComponentViewProtocol> *> *_registry;
  NSMapTable<NSString *, NSHashTable<UIView<ABI31_0_0RCTComponentViewProtocol> *> *> *_recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _registry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsIntegerPersonality | NSPointerFunctionsOpaqueMemory
                                      valueOptions:NSPointerFunctionsObjectPersonality];
    _recyclePool = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsObjectPersonality
                                         valueOptions:NSPointerFunctionsObjectPersonality];
  }

  return self;
}

- (UIView<ABI31_0_0RCTComponentViewProtocol> *)dequeueComponentViewWithName:(NSString *)componentName
                                                               tag:(ReactABI31_0_0Tag)tag
{
  ABI31_0_0RCTAssertMainQueue();

  ABI31_0_0RCTAssert(![_registry objectForKey:(__bridge id)(void *)tag],
    @"ABI31_0_0RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  UIView<ABI31_0_0RCTComponentViewProtocol> *componentView =
    [self _dequeueComponentViewWithName:componentName];
  componentView.tag = tag;
  [_registry setObject:componentView forKey:(__bridge id)(void *)tag];

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [ABI31_0_0RCTUIManager registerView:componentView];
#endif

  return componentView;
}

- (void)enqueueComponentViewWithName:(NSString *)componentName
                                 tag:(ReactABI31_0_0Tag)tag
                       componentView:(UIView<ABI31_0_0RCTComponentViewProtocol> *)componentView
{
  ABI31_0_0RCTAssertMainQueue();

  ABI31_0_0RCTAssert([_registry objectForKey:(__bridge id)(void *)tag],
    @"ABI31_0_0RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

#ifdef LEGACY_UIMANAGER_INTEGRATION_ENABLED
  [ABI31_0_0RCTUIManager unregisterView:componentView];
#endif

  [_registry removeObjectForKey:(__bridge id)(void *)tag];
  componentView.tag = 0;
  [self _enqueueComponentViewWithName:componentName componentView:componentView];
}

- (void)preliminaryCreateComponentViewWithName:(NSString *)componentName
{
  ABI31_0_0RCTAssertMainQueue();
  [self _enqueueComponentViewWithName:componentName
                        componentView:[self _createComponentViewWithName:componentName]];
}

- (UIView<ABI31_0_0RCTComponentViewProtocol> *)componentViewByTag:(ReactABI31_0_0Tag)tag
{
  ABI31_0_0RCTAssertMainQueue();
  return [_registry objectForKey:(__bridge id)(void *)tag];
}

- (ReactABI31_0_0Tag)tagByComponentView:(UIView<ABI31_0_0RCTComponentViewProtocol> *)componentView
{
  ABI31_0_0RCTAssertMainQueue();
  return componentView.tag;
}

- (UIView<ABI31_0_0RCTComponentViewProtocol> *)_createComponentViewWithName:(NSString *)componentName
{
  ABI31_0_0RCTAssertMainQueue();
  // This is temporary approach.
  NSString *className = [NSString stringWithFormat:@"ABI31_0_0RCT%@ComponentView", componentName];
  UIView<ABI31_0_0RCTComponentViewProtocol> *componentView = [[NSClassFromString(className) alloc] init];
  return componentView;
}

- (nullable UIView<ABI31_0_0RCTComponentViewProtocol> *)_dequeueComponentViewWithName:(NSString *)componentName
{
  ABI31_0_0RCTAssertMainQueue();
  NSHashTable<UIView<ABI31_0_0RCTComponentViewProtocol> *> *componentViews = [_recyclePool objectForKey:componentName];
  if (!componentViews || componentViews.count == 0) {
    return [self _createComponentViewWithName:componentName];
  }

  UIView<ABI31_0_0RCTComponentViewProtocol> *componentView = [componentViews anyObject];
  [componentViews removeObject:componentView];
  return componentView;
}

- (void)_enqueueComponentViewWithName:(NSString *)componentName
                        componentView:(UIView<ABI31_0_0RCTComponentViewProtocol> *)componentView
{
  ABI31_0_0RCTAssertMainQueue();
  [componentView prepareForRecycle];

  NSHashTable<UIView<ABI31_0_0RCTComponentViewProtocol> *> *componentViews = [_recyclePool objectForKey:componentName];
  if (!componentViews) {
    componentViews = [NSHashTable hashTableWithOptions:NSPointerFunctionsObjectPersonality];
    [_recyclePool setObject:componentViews forKey:componentName];
  }

  if (componentViews.count >= ABI31_0_0RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  [componentViews addObject:componentView];
}

@end
