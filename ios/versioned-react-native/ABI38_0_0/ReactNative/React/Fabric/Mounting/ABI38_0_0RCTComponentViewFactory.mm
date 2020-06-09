/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTComponentViewFactory.h"

#import <ABI38_0_0React/ABI38_0_0RCTAssert.h>
#import <ABI38_0_0React/ABI38_0_0RCTConversions.h>

#import <better/map.h>
#import <better/mutex.h>

#import <ABI38_0_0React/core/ABI38_0_0ReactPrimitives.h>
#import <ABI38_0_0React/uimanager/ComponentDescriptorProviderRegistry.h>

#import "ABI38_0_0RCTARTSurfaceViewComponentView.h"
#import "ABI38_0_0RCTActivityIndicatorViewComponentView.h"
#import "ABI38_0_0RCTComponentViewClassDescriptor.h"
#import "ABI38_0_0RCTFabricComponentsPlugins.h"
#import "ABI38_0_0RCTImageComponentView.h"
#import "ABI38_0_0RCTLegacyViewManagerInteropComponentView.h"
#import "ABI38_0_0RCTModalHostViewComponentView.h"
#import "ABI38_0_0RCTMountingTransactionObserving.h"
#import "ABI38_0_0RCTParagraphComponentView.h"
#import "ABI38_0_0RCTPullToRefreshViewComponentView.h"
#import "ABI38_0_0RCTRootComponentView.h"
#import "ABI38_0_0RCTSliderComponentView.h"
#import "ABI38_0_0RCTSwitchComponentView.h"
#import "ABI38_0_0RCTUnimplementedNativeComponentView.h"
#import "ABI38_0_0RCTUnimplementedViewComponentView.h"
#import "ABI38_0_0RCTViewComponentView.h"

#import <objc/runtime.h>

using namespace ABI38_0_0facebook::ABI38_0_0React;

@implementation ABI38_0_0RCTComponentViewFactory {
  better::map<ComponentHandle, ABI38_0_0RCTComponentViewClassDescriptor> _componentViewClasses;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (ABI38_0_0RCTComponentViewFactory *)standardComponentViewFactory
{
  ABI38_0_0RCTComponentViewFactory *componentViewFactory = [[ABI38_0_0RCTComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTPullToRefreshViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTImageComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTActivityIndicatorViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTSliderComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTSwitchComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTUnimplementedNativeComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTModalHostViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI38_0_0RCTARTSurfaceViewComponentView class]];

  auto providerRegistry = &componentViewFactory->_providerRegistry;

  providerRegistry->setComponentDescriptorProviderRequest([providerRegistry,
                                                           componentViewFactory](ComponentName requestedComponentName) {
    // Fallback 1: Call delegate for component view class.
    if (componentViewFactory.delegate) {
      Class<ABI38_0_0RCTComponentViewProtocol> klass =
          [componentViewFactory.delegate componentViewClassWithName:requestedComponentName];
      if (klass) {
        [componentViewFactory registerComponentViewClass:klass];
        return;
      }
    }

    // Fallback 3: Try to use Paper Interop.
    if ([ABI38_0_0RCTLegacyViewManagerInteropComponentView isSupported:ABI38_0_0RCTNSStringFromString(requestedComponentName)]) {
      auto flavor = std::make_shared<std::string const>(requestedComponentName);
      auto componentName = ComponentName{flavor->c_str()};
      auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
      auto constructor = [ABI38_0_0RCTLegacyViewManagerInteropComponentView componentDescriptorProvider].constructor;

      providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

      componentViewFactory->_componentViewClasses[componentHandle] = [componentViewFactory
          _componentViewClassDescriptorFromClass:[ABI38_0_0RCTLegacyViewManagerInteropComponentView class]];
      return;
    }

    // Fallback 4: Finally use <UnimplementedView>.
    auto flavor = std::make_shared<std::string const>(requestedComponentName);
    auto componentName = ComponentName{flavor->c_str()};
    auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
    auto constructor = [ABI38_0_0RCTUnimplementedViewComponentView componentDescriptorProvider].constructor;

    providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

    componentViewFactory->_componentViewClasses[componentHandle] =
        [componentViewFactory _componentViewClassDescriptorFromClass:[ABI38_0_0RCTUnimplementedViewComponentView class]];
  });

  return componentViewFactory;
}

- (ABI38_0_0RCTComponentViewClassDescriptor)_componentViewClassDescriptorFromClass:(Class<ABI38_0_0RCTComponentViewProtocol>)viewClass
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  return ABI38_0_0RCTComponentViewClassDescriptor
  {
    .viewClass = viewClass,
    .observesMountingTransactionWillMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionWillMountWithMetadata:)),
    .observesMountingTransactionDidMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionDidMountWithMetadata:)),
  };
#pragma clang diagnostic pop
}

- (void)registerComponentViewClass:(Class<ABI38_0_0RCTComponentViewProtocol>)componentViewClass
{
  std::unique_lock<better::shared_mutex> lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses[componentDescriptorProvider.handle] =
      [self _componentViewClassDescriptorFromClass:componentViewClass];
  _providerRegistry.add(componentDescriptorProvider);

  auto supplementalComponentDescriptorProviders = [componentViewClass supplementalComponentDescriptorProviders];
  for (const auto &provider : supplementalComponentDescriptorProviders) {
    _providerRegistry.add(provider);
  }
}

- (ABI38_0_0RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(ABI38_0_0facebook::ABI38_0_0React::ComponentHandle)componentHandle
{
  ABI38_0_0RCTAssertMainQueue();
  std::shared_lock<better::shared_mutex> lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  ABI38_0_0RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  auto componentViewClassDescriptor = iterator->second;
  Class viewClass = componentViewClassDescriptor.viewClass;

  return ABI38_0_0RCTComponentViewDescriptor{
      .view = [[viewClass alloc] init],
      .observesMountingTransactionWillMount = componentViewClassDescriptor.observesMountingTransactionWillMount,
      .observesMountingTransactionDidMount = componentViewClassDescriptor.observesMountingTransactionDidMount,
  };
}

- (ABI38_0_0facebook::ABI38_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI38_0_0facebook::ABI38_0_0React::ComponentDescriptorParameters)parameters
{
  std::shared_lock<better::shared_mutex> lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
