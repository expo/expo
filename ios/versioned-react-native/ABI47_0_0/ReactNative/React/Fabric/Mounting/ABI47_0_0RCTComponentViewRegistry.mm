/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <ABI47_0_0React/ABI47_0_0RCTAssert.h>
#import <ABI47_0_0React/ABI47_0_0RCTConstants.h>

#import "ABI47_0_0RCTImageComponentView.h"
#import "ABI47_0_0RCTParagraphComponentView.h"
#import "ABI47_0_0RCTViewComponentView.h"

#import <butter/map.h>

using namespace ABI47_0_0facebook::ABI47_0_0React;

const NSInteger ABI47_0_0RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation ABI47_0_0RCTComponentViewRegistry {
  butter::map<Tag, ABI47_0_0RCTComponentViewDescriptor> _registry;
  butter::map<ComponentHandle, std::vector<ABI47_0_0RCTComponentViewDescriptor>> _recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewFactory = [ABI47_0_0RCTComponentViewFactory currentComponentViewFactory];

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
  if (ABI47_0_0RCTExperimentGetPreemptiveViewAllocationDisabled()) {
    return;
  }

  // This data is based on empirical evidence which should represent the reality pretty well.
  // Regular `<View>` has magnitude equals to `1` by definition.
  std::vector<std::pair<ComponentHandle, float>> componentMagnitudes = {
      {[ABI47_0_0RCTViewComponentView componentDescriptorProvider].handle, 1},
      {[ABI47_0_0RCTImageComponentView componentDescriptorProvider].handle, 0.3},
      {[ABI47_0_0RCTParagraphComponentView componentDescriptorProvider].handle, 0.3},
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

- (ABI47_0_0RCTComponentViewDescriptor const &)dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                                                          tag:(Tag)tag
{
  ABI47_0_0RCTAssertMainQueue();

  ABI47_0_0RCTAssert(
      _registry.find(tag) == _registry.end(),
      @"ABI47_0_0RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  auto componentViewDescriptor = [self _dequeueComponentViewWithComponentHandle:componentHandle];
  componentViewDescriptor.view.tag = tag;
  auto it = _registry.insert({tag, componentViewDescriptor});
  return it.first->second;
}

- (void)enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                            tag:(Tag)tag
                        componentViewDescriptor:(ABI47_0_0RCTComponentViewDescriptor)componentViewDescriptor
{
  ABI47_0_0RCTAssertMainQueue();

  ABI47_0_0RCTAssert(
      _registry.find(tag) != _registry.end(), @"ABI47_0_0RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

  _registry.erase(tag);
  componentViewDescriptor.view.tag = 0;
  [self _enqueueComponentViewWithComponentHandle:componentHandle componentViewDescriptor:componentViewDescriptor];
}

- (void)optimisticallyCreateComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  ABI47_0_0RCTAssertMainQueue();
  [self _enqueueComponentViewWithComponentHandle:componentHandle
                         componentViewDescriptor:[self.componentViewFactory
                                                     createComponentViewWithComponentHandle:componentHandle]];
}

- (ABI47_0_0RCTComponentViewDescriptor const &)componentViewDescriptorWithTag:(Tag)tag
{
  ABI47_0_0RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  ABI47_0_0RCTAssert(iterator != _registry.end(), @"ABI47_0_0RCTComponentViewRegistry: Attempt to query unregistered component.");
  return iterator->second;
}

- (nullable UIView<ABI47_0_0RCTComponentViewProtocol> *)findComponentViewWithTag:(Tag)tag
{
  ABI47_0_0RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  if (iterator == _registry.end()) {
    return nil;
  }
  return iterator->second.view;
}

- (ABI47_0_0RCTComponentViewDescriptor)_dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  ABI47_0_0RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.empty()) {
    return [self.componentViewFactory createComponentViewWithComponentHandle:componentHandle];
  }

  auto componentViewDescriptor = recycledViews.back();
  recycledViews.pop_back();
  return componentViewDescriptor;
}

- (void)_enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                         componentViewDescriptor:(ABI47_0_0RCTComponentViewDescriptor)componentViewDescriptor
{
  ABI47_0_0RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.size() > ABI47_0_0RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  ABI47_0_0RCTAssert(
      componentViewDescriptor.view.superview == nil, @"ABI47_0_0RCTComponentViewRegistry: Attempt to recycle a mounted view.");
  [componentViewDescriptor.view prepareForRecycle];

  recycledViews.push_back(componentViewDescriptor);
}

- (void)handleApplicationDidReceiveMemoryWarningNotification
{
  _recyclePool.clear();
}

@end
