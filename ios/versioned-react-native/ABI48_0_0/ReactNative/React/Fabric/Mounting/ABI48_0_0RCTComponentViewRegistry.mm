/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>
#import <ABI48_0_0React/ABI48_0_0RCTConstants.h>

#import "ABI48_0_0RCTImageComponentView.h"
#import "ABI48_0_0RCTParagraphComponentView.h"
#import "ABI48_0_0RCTViewComponentView.h"

#import <ABI48_0_0butter/ABI48_0_0map.h>

using namespace ABI48_0_0facebook::ABI48_0_0React;

const NSInteger ABI48_0_0RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation ABI48_0_0RCTComponentViewRegistry {
  butter::map<Tag, ABI48_0_0RCTComponentViewDescriptor> _registry;
  butter::map<ComponentHandle, std::vector<ABI48_0_0RCTComponentViewDescriptor>> _recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewFactory = [ABI48_0_0RCTComponentViewFactory currentComponentViewFactory];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleApplicationDidReceiveMemoryWarningNotification)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];
  }

  return self;
}

- (ABI48_0_0RCTComponentViewDescriptor const &)dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                                                          tag:(Tag)tag
{
  ABI48_0_0RCTAssertMainQueue();

  ABI48_0_0RCTAssert(
      _registry.find(tag) == _registry.end(),
      @"ABI48_0_0RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  auto componentViewDescriptor = [self _dequeueComponentViewWithComponentHandle:componentHandle];
  componentViewDescriptor.view.tag = tag;
  auto it = _registry.insert({tag, componentViewDescriptor});
  return it.first->second;
}

- (void)enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                            tag:(Tag)tag
                        componentViewDescriptor:(ABI48_0_0RCTComponentViewDescriptor)componentViewDescriptor
{
  ABI48_0_0RCTAssertMainQueue();

  ABI48_0_0RCTAssert(
      _registry.find(tag) != _registry.end(), @"ABI48_0_0RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

  _registry.erase(tag);
  componentViewDescriptor.view.tag = 0;
  [self _enqueueComponentViewWithComponentHandle:componentHandle componentViewDescriptor:componentViewDescriptor];
}

- (ABI48_0_0RCTComponentViewDescriptor const &)componentViewDescriptorWithTag:(Tag)tag
{
  ABI48_0_0RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  ABI48_0_0RCTAssert(iterator != _registry.end(), @"ABI48_0_0RCTComponentViewRegistry: Attempt to query unregistered component.");
  return iterator->second;
}

- (nullable UIView<ABI48_0_0RCTComponentViewProtocol> *)findComponentViewWithTag:(Tag)tag
{
  ABI48_0_0RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  if (iterator == _registry.end()) {
    return nil;
  }
  return iterator->second.view;
}

- (ABI48_0_0RCTComponentViewDescriptor)_dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  ABI48_0_0RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.empty()) {
    return [self.componentViewFactory createComponentViewWithComponentHandle:componentHandle];
  }

  auto componentViewDescriptor = recycledViews.back();
  recycledViews.pop_back();
  return componentViewDescriptor;
}

- (void)_enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                         componentViewDescriptor:(ABI48_0_0RCTComponentViewDescriptor)componentViewDescriptor
{
  ABI48_0_0RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.size() > ABI48_0_0RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  ABI48_0_0RCTAssert(
      componentViewDescriptor.view.superview == nil, @"ABI48_0_0RCTComponentViewRegistry: Attempt to recycle a mounted view.");
  [componentViewDescriptor.view prepareForRecycle];

  recycledViews.push_back(componentViewDescriptor);
}

- (void)handleApplicationDidReceiveMemoryWarningNotification
{
  _recyclePool.clear();
}

@end
