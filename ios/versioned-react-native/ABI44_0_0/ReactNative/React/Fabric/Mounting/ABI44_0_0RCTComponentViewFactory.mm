/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTComponentViewFactory.h"

#import <ABI44_0_0React/ABI44_0_0RCTAssert.h>
#import <ABI44_0_0React/ABI44_0_0RCTConversions.h>

#import <better/map.h>
#import <better/mutex.h>

#import <ABI44_0_0React/ABI44_0_0renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#import <ABI44_0_0React/ABI44_0_0renderer/core/ABI44_0_0ReactPrimitives.h>

#ifdef ABI44_0_0RN_DISABLE_OSS_PLUGIN_HEADER
#import <ABI44_0_0RCTFabricComponentPlugin/ABI44_0_0RCTFabricPluginProvider.h>
#else
#import "ABI44_0_0RCTFabricComponentsPlugins.h"
#endif

#import "ABI44_0_0RCTComponentViewClassDescriptor.h"
#import "ABI44_0_0RCTFabricComponentsPlugins.h"
#import "ABI44_0_0RCTImageComponentView.h"
#import "ABI44_0_0RCTLegacyViewManagerInteropComponentView.h"
#import "ABI44_0_0RCTMountingTransactionObserving.h"
#import "ABI44_0_0RCTParagraphComponentView.h"
#import "ABI44_0_0RCTRootComponentView.h"
#import "ABI44_0_0RCTTextInputComponentView.h"
#import "ABI44_0_0RCTUnimplementedViewComponentView.h"
#import "ABI44_0_0RCTViewComponentView.h"

#import <objc/runtime.h>

using namespace ABI44_0_0facebook::ABI44_0_0React;

static Class<ABI44_0_0RCTComponentViewProtocol> ABI44_0_0RCTComponentViewClassWithName(const char *componentName)
{
  return ABI44_0_0RCTFabricComponentsProvider(componentName);
}

@implementation ABI44_0_0RCTComponentViewFactory {
  better::map<ComponentHandle, ABI44_0_0RCTComponentViewClassDescriptor> _componentViewClasses;
  ComponentDescriptorProviderRegistry _providerRegistry;
  better::shared_mutex _mutex;
}

+ (ABI44_0_0RCTComponentViewFactory *)standardComponentViewFactory
{
  ABI44_0_0RCTComponentViewFactory *componentViewFactory = [[ABI44_0_0RCTComponentViewFactory alloc] init];

  [componentViewFactory registerComponentViewClass:[ABI44_0_0RCTRootComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI44_0_0RCTViewComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI44_0_0RCTParagraphComponentView class]];
  [componentViewFactory registerComponentViewClass:[ABI44_0_0RCTTextInputComponentView class]];

  Class<ABI44_0_0RCTComponentViewProtocol> imageClass = ABI44_0_0RCTComponentViewClassWithName("Image");
  [componentViewFactory registerComponentViewClass:imageClass];

  auto providerRegistry = &componentViewFactory->_providerRegistry;

  providerRegistry->setComponentDescriptorProviderRequest(
      [providerRegistry, componentViewFactory](ComponentName requestedComponentName) {
        // Fallback 1: Call provider function for component view class.
        Class<ABI44_0_0RCTComponentViewProtocol> klass = ABI44_0_0RCTComponentViewClassWithName(requestedComponentName);
        if (klass) {
          [componentViewFactory registerComponentViewClass:klass];
          return;
        }

        // Fallback 2: Try to use Paper Interop.
        if ([ABI44_0_0RCTLegacyViewManagerInteropComponentView isSupported:ABI44_0_0RCTNSStringFromString(requestedComponentName)]) {
          auto flavor = std::make_shared<std::string const>(requestedComponentName);
          auto componentName = ComponentName{flavor->c_str()};
          auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
          auto constructor = [ABI44_0_0RCTLegacyViewManagerInteropComponentView componentDescriptorProvider].constructor;

          providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

          componentViewFactory->_componentViewClasses[componentHandle] = [componentViewFactory
              _componentViewClassDescriptorFromClass:[ABI44_0_0RCTLegacyViewManagerInteropComponentView class]];
          return;
        }

        // Fallback 3: Finally use <UnimplementedView>.
        auto flavor = std::make_shared<std::string const>(requestedComponentName);
        auto componentName = ComponentName{flavor->c_str()};
        auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
        auto constructor = [ABI44_0_0RCTUnimplementedViewComponentView componentDescriptorProvider].constructor;

        providerRegistry->add(ComponentDescriptorProvider{componentHandle, componentName, flavor, constructor});

        componentViewFactory->_componentViewClasses[componentHandle] =
            [componentViewFactory _componentViewClassDescriptorFromClass:[ABI44_0_0RCTUnimplementedViewComponentView class]];
      });

  return componentViewFactory;
}

- (ABI44_0_0RCTComponentViewClassDescriptor)_componentViewClassDescriptorFromClass:(Class<ABI44_0_0RCTComponentViewProtocol>)viewClass
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  return ABI44_0_0RCTComponentViewClassDescriptor
  {
    .viewClass = viewClass,
    .observesMountingTransactionWillMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionWillMountWithMetadata:)),
    .observesMountingTransactionDidMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionDidMountWithMetadata:)),
  };
#pragma clang diagnostic pop
}

- (void)registerComponentViewClass:(Class<ABI44_0_0RCTComponentViewProtocol>)componentViewClass
{
  ABI44_0_0RCTAssert(componentViewClass, @"ABI44_0_0RCTComponentViewFactory: Provided `componentViewClass` is `nil`.");
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

- (ABI44_0_0RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(ABI44_0_0facebook::ABI44_0_0React::ComponentHandle)componentHandle
{
  ABI44_0_0RCTAssertMainQueue();
  std::shared_lock<better::shared_mutex> lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  ABI44_0_0RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  auto componentViewClassDescriptor = iterator->second;
  Class viewClass = componentViewClassDescriptor.viewClass;

  return ABI44_0_0RCTComponentViewDescriptor{
      .view = [[viewClass alloc] init],
      .observesMountingTransactionWillMount = componentViewClassDescriptor.observesMountingTransactionWillMount,
      .observesMountingTransactionDidMount = componentViewClassDescriptor.observesMountingTransactionDidMount,
  };
}

- (ABI44_0_0facebook::ABI44_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI44_0_0facebook::ABI44_0_0React::ComponentDescriptorParameters)parameters
{
  std::shared_lock<better::shared_mutex> lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
