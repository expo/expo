/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTComponentViewFactory.h"

#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>

#import <ABI49_0_0butter/ABI49_0_0map.h>
#import <ABI49_0_0butter/ABI49_0_0set.h>
#import <shared_mutex>

#import <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorProviderRegistry.h>
#import <ABI49_0_0React/renderer/componentregistry/ABI49_0_0componentNameByABI49_0_0ReactViewName.h>
#import <ABI49_0_0React/ABI49_0_0renderer/componentregistry/native/NativeComponentRegistryBinding.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>

#ifdef ABI49_0_0RN_DISABLE_OSS_PLUGIN_HEADER
#import <ABI49_0_0RCTFabricComponentPlugin/ABI49_0_0RCTFabricPluginProvider.h>
#else
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#endif

#import <ABI49_0_0React/ABI49_0_0RCTComponentViewClassDescriptor.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageComponentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTLegacyViewManagerInteropComponentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTMountingTransactionObserving.h>
#import <ABI49_0_0React/ABI49_0_0RCTParagraphComponentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootComponentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTTextInputComponentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTUnimplementedViewComponentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>

#import <objc/runtime.h>

using namespace ABI49_0_0facebook;
using namespace ABI49_0_0facebook::ABI49_0_0React;

// Allow JS runtime to register native components as needed. For static view configs.
void ABI49_0_0RCTInstallNativeComponentRegistryBinding(ABI49_0_0facebook::jsi::Runtime &runtime)
{
  auto hasComponentProvider = [](std::string const &name) -> bool {
    return [[ABI49_0_0RCTComponentViewFactory currentComponentViewFactory]
        registerComponentIfPossible:componentNameByABI49_0_0ReactViewName(name)];
  };
  NativeComponentRegistryBinding::install(runtime, std::move(hasComponentProvider));
}

static Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RCTComponentViewClassWithName(const char *componentName)
{
  return ABI49_0_0RCTFabricComponentsProvider(componentName);
}

@implementation ABI49_0_0RCTComponentViewFactory {
  butter::map<ComponentHandle, ABI49_0_0RCTComponentViewClassDescriptor> _componentViewClasses;
  butter::set<std::string> _registeredComponentsNames;
  ComponentDescriptorProviderRegistry _providerRegistry;
  std::shared_mutex _mutex;
}

+ (ABI49_0_0RCTComponentViewFactory *)currentComponentViewFactory
{
  static dispatch_once_t onceToken;
  static ABI49_0_0RCTComponentViewFactory *componentViewFactory;

  dispatch_once(&onceToken, ^{
    componentViewFactory = [ABI49_0_0RCTComponentViewFactory new];
    [componentViewFactory registerComponentViewClass:[ABI49_0_0RCTRootComponentView class]];
    [componentViewFactory registerComponentViewClass:[ABI49_0_0RCTParagraphComponentView class]];

    componentViewFactory->_providerRegistry.setComponentDescriptorProviderRequest(
        [](ComponentName requestedComponentName) {
          [componentViewFactory registerComponentIfPossible:requestedComponentName];
        });
  });

  return componentViewFactory;
}

- (ABI49_0_0RCTComponentViewClassDescriptor)_componentViewClassDescriptorFromClass:(Class<ABI49_0_0RCTComponentViewProtocol>)viewClass
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  return ABI49_0_0RCTComponentViewClassDescriptor
  {
    .viewClass = viewClass,
    .observesMountingTransactionWillMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionWillMount:withSurfaceTelemetry:)),
    .observesMountingTransactionDidMount =
        (bool)class_respondsToSelector(viewClass, @selector(mountingTransactionDidMount:withSurfaceTelemetry:)),
  };
#pragma clang diagnostic pop
}

- (BOOL)registerComponentIfPossible:(std::string const &)name
{
  if (_registeredComponentsNames.find(name) != _registeredComponentsNames.end()) {
    // Component has already been registered.
    return YES;
  }

  // Fallback 1: Call provider function for component view class.
  Class<ABI49_0_0RCTComponentViewProtocol> klass = ABI49_0_0RCTComponentViewClassWithName(name.c_str());
  if (klass) {
    [self registerComponentViewClass:klass];
    return YES;
  }

  // Fallback 2: Try to use Paper Interop.
  NSString *componentNameString = ABI49_0_0RCTNSStringFromString(name);
  if ([ABI49_0_0RCTLegacyViewManagerInteropComponentView isSupported:componentNameString]) {
    ABI49_0_0RCTLogNewArchitectureValidation(
        ABI49_0_0RCTNotAllowedInBridgeless,
        self,
        [NSString
            stringWithFormat:
                @"Legacy ViewManagers should be migrated to Fabric ComponentViews in the new architecture to reduce risk. Component using interop layer: %@",
                componentNameString]);

    auto flavor = std::make_shared<std::string const>(name);
    auto componentName = ComponentName{flavor->c_str()};
    auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
    auto constructor = [ABI49_0_0RCTLegacyViewManagerInteropComponentView componentDescriptorProvider].constructor;

    [self _addDescriptorToProviderRegistry:ComponentDescriptorProvider{
                                               componentHandle, componentName, flavor, constructor}];

    _componentViewClasses[componentHandle] =
        [self _componentViewClassDescriptorFromClass:[ABI49_0_0RCTLegacyViewManagerInteropComponentView class]];
    return YES;
  }

  // Fallback 3: use <UnimplementedView> if component doesn't exist.
  auto flavor = std::make_shared<std::string const>(name);
  auto componentName = ComponentName{flavor->c_str()};
  auto componentHandle = reinterpret_cast<ComponentHandle>(componentName);
  auto constructor = [ABI49_0_0RCTUnimplementedViewComponentView componentDescriptorProvider].constructor;

  [self _addDescriptorToProviderRegistry:ComponentDescriptorProvider{
                                             componentHandle, componentName, flavor, constructor}];

  _componentViewClasses[componentHandle] =
      [self _componentViewClassDescriptorFromClass:[ABI49_0_0RCTUnimplementedViewComponentView class]];

  // No matching class exists for `name`.
  return NO;
}

- (void)registerComponentViewClass:(Class<ABI49_0_0RCTComponentViewProtocol>)componentViewClass
{
  ABI49_0_0RCTAssert(componentViewClass, @"ABI49_0_0RCTComponentViewFactory: Provided `componentViewClass` is `nil`.");
  std::unique_lock lock(_mutex);

  auto componentDescriptorProvider = [componentViewClass componentDescriptorProvider];
  _componentViewClasses[componentDescriptorProvider.handle] =
      [self _componentViewClassDescriptorFromClass:componentViewClass];
  [self _addDescriptorToProviderRegistry:componentDescriptorProvider];

  auto supplementalComponentDescriptorProviders = [componentViewClass supplementalComponentDescriptorProviders];
  for (const auto &provider : supplementalComponentDescriptorProviders) {
    [self _addDescriptorToProviderRegistry:provider];
  }
}

- (void)_addDescriptorToProviderRegistry:(ComponentDescriptorProvider const &)provider
{
  _registeredComponentsNames.insert(provider.name);
  _providerRegistry.add(provider);
}

- (ABI49_0_0RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(ABI49_0_0facebook::ABI49_0_0React::ComponentHandle)componentHandle
{
  ABI49_0_0RCTAssertMainQueue();
  std::shared_lock lock(_mutex);

  auto iterator = _componentViewClasses.find(componentHandle);
  ABI49_0_0RCTAssert(
      iterator != _componentViewClasses.end(),
      @"ComponentView with componentHandle `%lli` (`%s`) not found.",
      componentHandle,
      (char *)componentHandle);
  auto componentViewClassDescriptor = iterator->second;
  Class viewClass = componentViewClassDescriptor.viewClass;

  return ABI49_0_0RCTComponentViewDescriptor{
      .view = [viewClass new],
      .observesMountingTransactionWillMount = componentViewClassDescriptor.observesMountingTransactionWillMount,
      .observesMountingTransactionDidMount = componentViewClassDescriptor.observesMountingTransactionDidMount,
  };
}

- (ABI49_0_0facebook::ABI49_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI49_0_0facebook::ABI49_0_0React::ComponentDescriptorParameters)parameters
{
  std::shared_lock lock(_mutex);

  return _providerRegistry.createComponentDescriptorRegistry(parameters);
}

@end
