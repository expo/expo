/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTComponentViewFactory.h"

#import <ABI36_0_0React/ABI36_0_0RCTAssert.h>
#import <better/map.h>
#import <better/mutex.h>

#import <ABI36_0_0React/core/ABI36_0_0ReactPrimitives.h>
#import <ABI36_0_0React/uimanager/ComponentDescriptorProviderRegistry.h>

#import "ABI36_0_0RCTActivityIndicatorViewComponentView.h"
#import "ABI36_0_0RCTImageComponentView.h"
#import "ABI36_0_0RCTModalHostViewComponentView.h"
#import "ABI36_0_0RCTParagraphComponentView.h"
#import "ABI36_0_0RCTPullToRefreshViewComponentView.h"
#import "ABI36_0_0RCTRootComponentView.h"
#import "ABI36_0_0RCTScrollViewComponentView.h"
#import "ABI36_0_0RCTSliderComponentView.h"
#import "ABI36_0_0RCTSwitchComponentView.h"
#import "ABI36_0_0RCTUnimplementedNativeComponentView.h"
#import "ABI36_0_0RCTViewComponentView.h"

using namespace ABI36_0_0facebook::ABI36_0_0React;

@implementation ABI36_0_0RCTComponentViewFactory {
  better::map<ComponentHandle, Class<ABI36_0_0RCTComponentViewProtocol>> _componentViewClasses;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (ABI36_0_0RCTComponentViewFactory *)standardComponentViewFactory
{
  ABI36_0_0RCTComponentViewFactory *componentViewFactory = [[ABI36_0_0RCTComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTScrollViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTPullToRefreshViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTImageComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTActivityIndicatorViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTSliderComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTSwitchComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTUnimplementedNativeComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI36_0_0RCTModalHostViewComponentView class]];

  return componentViewFactory;
}

- (void)registerComponentViewClass:(Class<ABI36_0_0RCTComponentViewProtocol>)componentViewClass
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses[componentDescriptorProvider.handle] = componentViewClass;
  _providerRegistry.add(componentDescriptorProvider);

  auto supplementalComponentDescriptorProviders = [componentViewClass supplementalComponentDescriptorProviders];
  for (const auto &provider : supplementalComponentDescriptorProviders) {
    _providerRegistry.add(provider);
  }
}

- (void)unregisterComponentViewClass:(Class<ABI36_0_0RCTComponentViewProtocol>)componentViewClass
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses.erase(componentDescriptorProvider.handle);
  _providerRegistry.remove(componentDescriptorProvider);
}

- (UIView<ABI36_0_0RCTComponentViewProtocol> *)createComponentViewWithComponentHandle:
    (ABI36_0_0facebook::ABI36_0_0React::ComponentHandle)componentHandle
{
  ABI36_0_0RCTAssertMainQueue();
  std::shared_lock<better::shared_mutex> lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  ABI36_0_0RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  Class componentViewClass = iterator->second;
  return [[componentViewClass alloc] init];
}

- (ABI36_0_0facebook::ABI36_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI36_0_0facebook::ABI36_0_0React::ComponentDescriptorParameters)parameters
{
  std::shared_lock<better::shared_mutex> lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
