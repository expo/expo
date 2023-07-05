/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTAppSetupUtils.h"

#import <ABI49_0_0React/ABI49_0_0RCTJSIExecutorRuntimeInstaller.h>
#import <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeScheduler.h>
#import <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeSchedulerBinding.h>

#if ABI49_0_0RCT_NEW_ARCH_ENABLED
// Turbo Module
#import <ABI49_0_0React/ABI49_0_0CoreModulesPlugins.h>
#import <ABI49_0_0React/ABI49_0_0RCTDataRequestHandler.h>
#import <ABI49_0_0React/ABI49_0_0RCTFileRequestHandler.h>
#import <ABI49_0_0React/ABI49_0_0RCTGIFImageDecoder.h>
#import <ABI49_0_0React/ABI49_0_0RCTHTTPRequestHandler.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTLocalAssetImageLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTNetworking.h>

// Fabric
#import <ABI49_0_0React/ABI49_0_0RCTFabricSurfaceHostingProxyRootView.h>
#import <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeScheduler.h>
#import <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeSchedulerBinding.h>
#endif

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <FlipperKitABI49_0_0ReactPlugin/FlipperKitABI49_0_0ReactPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>

static void InitializeFlipper(UIApplication *application)
{
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application
                                                withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitABI49_0_0ReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

void ABI49_0_0RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled)
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

#if ABI49_0_0RCT_NEW_ARCH_ENABLED
  ABI49_0_0RCTEnableTurboModule(turboModuleEnabled);
#endif
}

UIView *
ABI49_0_0RCTAppSetupDefaultRootView(ABI49_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled)
{
#if ABI49_0_0RCT_NEW_ARCH_ENABLED
  if (fabricEnabled) {
    return [[ABI49_0_0RCTFabricSurfaceHostingProxyRootView alloc] initWithBridge:bridge
                                                             moduleName:moduleName
                                                      initialProperties:initialProperties];
  }
#endif
  return [[ABI49_0_0RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

#if ABI49_0_0RCT_NEW_ARCH_ENABLED
id<ABI49_0_0RCTTurboModule> ABI49_0_0RCTAppSetupDefaultModuleFromClass(Class moduleClass)
{
  // Set up the default ABI49_0_0RCTImageLoader and ABI49_0_0RCTNetworking modules.
  if (moduleClass == ABI49_0_0RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil
        loadersProvider:^NSArray<id<ABI49_0_0RCTImageURLLoader>> *(ABI49_0_0RCTModuleRegistry *moduleRegistry) {
          return @[ [ABI49_0_0RCTLocalAssetImageLoader new] ];
        }
        decodersProvider:^NSArray<id<ABI49_0_0RCTImageDataDecoder>> *(ABI49_0_0RCTModuleRegistry *moduleRegistry) {
          return @[ [ABI49_0_0RCTGIFImageDecoder new] ];
        }];
  } else if (moduleClass == ABI49_0_0RCTNetworking.class) {
    return [[moduleClass alloc]
        initWithHandlersProvider:^NSArray<id<ABI49_0_0RCTURLRequestHandler>> *(ABI49_0_0RCTModuleRegistry *moduleRegistry) {
          return @[
            [ABI49_0_0RCTHTTPRequestHandler new],
            [ABI49_0_0RCTDataRequestHandler new],
            [ABI49_0_0RCTFileRequestHandler new],
          ];
        }];
  }
  // No custom initializer here.
  return [moduleClass new];
}

std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory> ABI49_0_0RCTAppSetupDefaultJsExecutorFactory(
    ABI49_0_0RCTBridge *bridge,
    ABI49_0_0RCTTurboModuleManager *turboModuleManager,
    std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::RuntimeScheduler> const &runtimeScheduler)
{
  // Necessary to allow NativeModules to lookup TurboModules
  [bridge setABI49_0_0RCTTurboModuleRegistry:turboModuleManager];

#if ABI49_0_0RCT_DEV
  if (!ABI49_0_0RCTTurboModuleEagerInitEnabled()) {
    /**
     * Instantiating DevMenu has the side-effect of registering
     * shortcuts for CMD + d, CMD + i,  and CMD + n via ABI49_0_0RCTDevMenu.
     * Therefore, when TurboModules are enabled, we must manually create this
     * NativeModule.
     */
    [turboModuleManager moduleForName:"ABI49_0_0RCTDevMenu"];
  }
#endif

#if ABI49_0_0RCT_USE_HERMES
  return std::make_unique<ABI49_0_0facebook::ABI49_0_0React::HermesExecutorFactory>(
#else
  return std::make_unique<ABI49_0_0facebook::ABI49_0_0React::JSCExecutorFactory>(
#endif
      ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RCTJSIExecutorRuntimeInstaller(
          [turboModuleManager, bridge, runtimeScheduler](ABI49_0_0facebook::jsi::Runtime &runtime) {
            if (!bridge || !turboModuleManager) {
              return;
            }
            if (runtimeScheduler) {
              ABI49_0_0facebook::ABI49_0_0React::RuntimeSchedulerBinding::createAndInstallIfNeeded(runtime, runtimeScheduler);
            }
            ABI49_0_0facebook::ABI49_0_0React::RuntimeExecutor syncRuntimeExecutor =
                [&](std::function<void(ABI49_0_0facebook::jsi::Runtime & runtime_)> &&callback) { callback(runtime); };
            [turboModuleManager installJSBindingWithRuntimeExecutor:syncRuntimeExecutor];
          }));
}

#else

std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory> ABI49_0_0RCTAppSetupJsExecutorFactoryForOldArch(
    ABI49_0_0RCTBridge *bridge,
    std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::RuntimeScheduler> const &runtimeScheduler)
{
#if ABI49_0_0RCT_USE_HERMES
  return std::make_unique<ABI49_0_0facebook::ABI49_0_0React::HermesExecutorFactory>(
#else
  return std::make_unique<ABI49_0_0facebook::ABI49_0_0React::JSCExecutorFactory>(
#endif
      ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RCTJSIExecutorRuntimeInstaller([bridge, runtimeScheduler](ABI49_0_0facebook::jsi::Runtime &runtime) {
        if (!bridge) {
          return;
        }
        if (runtimeScheduler) {
          ABI49_0_0facebook::ABI49_0_0React::RuntimeSchedulerBinding::createAndInstallIfNeeded(runtime, runtimeScheduler);
        }
      }));
}

#endif
