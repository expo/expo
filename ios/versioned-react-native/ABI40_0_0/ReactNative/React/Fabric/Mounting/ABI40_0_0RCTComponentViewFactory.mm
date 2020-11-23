/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTComponentViewFactory.h"

#import <ABI40_0_0React/ABI40_0_0RCTAssert.h>
#import <ABI40_0_0React/ABI40_0_0RCTConversions.h>

#import <better/map.h>
#import <better/mutex.h>

#import <ABI40_0_0React/core/ABI40_0_0ReactPrimitives.h>
#import <ABI40_0_0React/uimanager/ComponentDescriptorProviderRegistry.h>

#ifdef ABI40_0_0RN_DISABLE_OSS_PLUGIN_HEADER
#import <ABI40_0_0RCTFabricComponentPlugin/ABI40_0_0RCTFabricPluginProvider.h>
#else
#import "ABI40_0_0RCTFabricComponentsPlugins.h"
#endif

#import "ABI40_0_0RCTComponentViewClassDescriptor.h"
#import "ABI40_0_0RCTFabricComponentsPlugins.h"
#import "ABI40_0_0RCTImageComponentView.h"
#import "ABI40_0_0RCTLegacyViewManagerInteropComponentView.h"
#import "ABI40_0_0RCTMountingTransactionObserving.h"
#import "ABI40_0_0RCTParagraphComponentView.h"
#import "ABI40_0_0RCTRootComponentView.h"
#import "ABI40_0_0RCTTextInputComponentView.h"
#import "ABI40_0_0RCTUnimplementedViewComponentView.h"
#import "ABI40_0_0RCTViewComponentView.h"

#import <objc/runtime.h>

using namespace ABI40_0_0facebook::ABI40_0_0React;

static Class<ABI40_0_0RCTComponentViewProtocol> ABI40_0_0RCTComponentViewClassWithName(const char *componentName)
{
  return ABI40_0_0RCTFabricComponentsProvider(componentName);
}

@implementation ABI40_0_0RCTComponentViewFactory {
  better::map<ComponentHandle, ABI40_0_0RCTComponentViewClassDescriptor> _componentViewClasses;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (ABI40_0_0RCTComponentViewFactory *)standardComponentViewFactory
{
  ABI40_0_0RCTComponentViewFactory *componentViewFactory = [[ABI40_0_0RCTComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[ABI40_0_0RCTRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI40_0_0RCTViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI40_0_0RCTParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI40_0_0RCTTextInputComponentView class]];

  Class<ABI40_0_0RCTComponentViewProtocol> imageClass = ABI40_0_0RCTComponentViewClassWithName("Image");
  [componentViewFactory registerComponentViewClass:imageClass];

  auto providerRegistry = &componentViewFactory->_providerRegistry;

  providerRegistry->setComponentDescriptorProviderRequest(
      [providerRegistry, componentViewFactory](ComponentName requestedComponentName) {
        // Fallback 1: Call provider function for component view class.
        Class<ABI40_0_0RCTComponentViewProtocol> klass = ABI40_0_0RCTComponentViewClassWithName(requestedComponentName);
        if (klass) {
          [componentViewFactory registerComponentViewClass:klass];
          return;
        }

        // Fallback 2: Try to use Paper Interop.
        if ([ABI40_0_0RCTLegacyViewManagerInteropComponentView isSupported:ABI40_0_0RCTNSStringFromString(requestedComponentName)]) {
          auto flavor = std::make_shared<std::string const>(requestedComponentName);
          auto componentName = ComponentName{flavor->c_str()};
          auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
          auto constructor = [ABI40_0_0RCTLegacyViewManagerInteropComponentView componentDescriptorProvider].constructor;

          providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

          componentViewFactory->_componentViewClasses[componentHandle] = [componentViewFactory
              _componentViewClassDescriptorFromClass:[ABI40_0_0RCTLegacyViewManagerInteropComponentView class]];
          return;
        }

        // Fallback 3: Finally use <UnimplementedView>.
        auto flavor = std::make_shared<std::string const>(requestedComponentName);
        auto componentName = ComponentName{flavor->c_str()};
        auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
        auto constructor = [ABI40_0_0RCTUnimplementedViewComponentView componentDescriptorProvider].constructor;

        providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

        componentViewFactory->_componentViewClasses[componentHandle] =
            [componentViewFactory _componentViewClassDescriptorFromClass:[ABI40_0_0RCTUnimplementedViewComponentView class]];
      });

  return componentViewFactory;
}

- (ABI40_0_0RCTComponentViewClassDescriptor)_componentViewClassDescriptorFromClass:(Class<ABI40_0_0RCTComponentViewProtocol>)viewClass
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  return ABI40_0_0RCTComponentViewClassDescriptor
  {
    .viewClass = viewClass,
    .observesMountingTransactionWillMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionWillMountWithMetadata:)),
    .observesMountingTransactionDidMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionDidMountWithMetadata:)),
  };
#pragma clang diagnostic pop
}

- (void)registerComponentViewClass:(Class<ABI40_0_0RCTComponentViewProtocol>)componentViewClass
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

- (ABI40_0_0RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(ABI40_0_0facebook::ABI40_0_0React::ComponentHandle)componentHandle
{
  ABI40_0_0RCTAssertMainQueue();
  std::shared_lock<better::shared_mutex> lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  ABI40_0_0RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  auto componentViewClassDescriptor = iterator->second;
  Class viewClass = componentViewClassDescriptor.viewClass;

  return ABI40_0_0RCTComponentViewDescriptor{
      .view = [[viewClass alloc] init],
      .observesMountingTransactionWillMount = componentViewClassDescriptor.observesMountingTransactionWillMount,
      .observesMountingTransactionDidMount = componentViewClassDescriptor.observesMountingTransactionDidMount,
  };
}

- (ABI40_0_0facebook::ABI40_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI40_0_0facebook::ABI40_0_0React::ComponentDescriptorParameters)parameters
{
  std::shared_lock<better::shared_mutex> lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
