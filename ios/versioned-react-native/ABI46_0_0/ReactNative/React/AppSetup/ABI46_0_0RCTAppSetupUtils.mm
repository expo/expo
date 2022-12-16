/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTAppSetupUtils.h"

#if ABI46_0_0RCT_NEW_ARCH_ENABLED
// Turbo Module
#import <ABI46_0_0React/ABI46_0_0CoreModulesPlugins.h>
#import <ABI46_0_0React/ABI46_0_0RCTDataRequestHandler.h>
#import <ABI46_0_0React/ABI46_0_0RCTFileRequestHandler.h>
#import <ABI46_0_0React/ABI46_0_0RCTGIFImageDecoder.h>
#import <ABI46_0_0React/ABI46_0_0RCTHTTPRequestHandler.h>
#import <ABI46_0_0React/ABI46_0_0RCTImageLoader.h>
#import <ABI46_0_0React/ABI46_0_0RCTJSIExecutorRuntimeInstaller.h>
#import <ABI46_0_0React/ABI46_0_0RCTLocalAssetImageLoader.h>
#import <ABI46_0_0React/ABI46_0_0RCTNetworking.h>

// Fabric
#import <ABI46_0_0React/ABI46_0_0RCTFabricSurfaceHostingProxyRootView.h>
#endif

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <FlipperKitABI46_0_0ReactPlugin/FlipperKitABI46_0_0ReactPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>

static void InitializeFlipper(UIApplication *application)
{
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application
                                                withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitABI46_0_0ReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

void ABI46_0_0RCTAppSetupPrepareApp(UIApplication *application)
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

#if ABI46_0_0RCT_NEW_ARCH_ENABLED
  ABI46_0_0RCTEnableTurboModule(YES);
#endif
}

UIView *ABI46_0_0RCTAppSetupDefaultRootView(ABI46_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties)
{
#if ABI46_0_0RCT_NEW_ARCH_ENABLED
  return [[ABI46_0_0RCTFabricSurfaceHostingProxyRootView alloc] initWithBridge:bridge
                                                           moduleName:moduleName
                                                    initialProperties:initialProperties];
#else
  return [[ABI46_0_0RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
#endif
}

#if ABI46_0_0RCT_NEW_ARCH_ENABLED
id<ABI46_0_0RCTTurboModule> ABI46_0_0RCTAppSetupDefaultModuleFromClass(Class moduleClass)
{
  // Set up the default ABI46_0_0RCTImageLoader and ABI46_0_0RCTNetworking modules.
  if (moduleClass == ABI46_0_0RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil
        loadersProvider:^NSArray<id<ABI46_0_0RCTImageURLLoader>> *(ABI46_0_0RCTModuleRegistry *moduleRegistry) {
          return @[ [ABI46_0_0RCTLocalAssetImageLoader new] ];
        }
        decodersProvider:^NSArray<id<ABI46_0_0RCTImageDataDecoder>> *(ABI46_0_0RCTModuleRegistry *moduleRegistry) {
          return @[ [ABI46_0_0RCTGIFImageDecoder new] ];
        }];
  } else if (moduleClass == ABI46_0_0RCTNetworking.class) {
    return [[moduleClass alloc]
        initWithHandlersProvider:^NSArray<id<ABI46_0_0RCTURLRequestHandler>> *(ABI46_0_0RCTModuleRegistry *moduleRegistry) {
          return @[
            [ABI46_0_0RCTHTTPRequestHandler new],
            [ABI46_0_0RCTDataRequestHandler new],
            [ABI46_0_0RCTFileRequestHandler new],
          ];
        }];
  }
  // No custom initializer here.
  return [moduleClass new];
}

std::unique_ptr<ABI46_0_0facebook::ABI46_0_0React::JSExecutorFactory> ABI46_0_0RCTAppSetupDefaultJsExecutorFactory(
    ABI46_0_0RCTBridge *bridge,
    ABI46_0_0RCTTurboModuleManager *turboModuleManager)
{
  // Necessary to allow NativeModules to lookup TurboModules
  [bridge setABI46_0_0RCTTurboModuleRegistry:turboModuleManager];

#if ABI46_0_0RCT_DEV
  if (!ABI46_0_0RCTTurboModuleEagerInitEnabled()) {
    /**
     * Instantiating DevMenu has the side-effect of registering
     * shortcuts for CMD + d, CMD + i,  and CMD + n via ABI46_0_0RCTDevMenu.
     * Therefore, when TurboModules are enabled, we must manually create this
     * NativeModule.
     */
    [turboModuleManager moduleForName:"ABI46_0_0RCTDevMenu"];
  }
#endif

#if ABI46_0_0RCT_USE_HERMES
  return std::make_unique<ABI46_0_0facebook::ABI46_0_0React::HermesExecutorFactory>(
#else
  return std::make_unique<ABI46_0_0facebook::ABI46_0_0React::JSCExecutorFactory>(
#endif
      ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RCTJSIExecutorRuntimeInstaller([turboModuleManager, bridge](ABI46_0_0facebook::jsi::Runtime &runtime) {
        if (!bridge || !turboModuleManager) {
          return;
        }
        ABI46_0_0facebook::ABI46_0_0React::RuntimeExecutor syncRuntimeExecutor =
            [&](std::function<void(ABI46_0_0facebook::jsi::Runtime & runtime_)> &&callback) { callback(runtime); };
        [turboModuleManager installJSBindingWithRuntimeExecutor:syncRuntimeExecutor];
      }));
}

#endif
