/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTRootView.h>

#if ABI46_0_0RCT_NEW_ARCH_ENABLED

#ifndef ABI46_0_0RCT_USE_HERMES
#if __has_include(<ABI46_0_0Reacthermes/HermesExecutorFactory.h>)
#define ABI46_0_0RCT_USE_HERMES 1
#else
#define ABI46_0_0RCT_USE_HERMES 0
#endif
#endif

#if ABI46_0_0RCT_USE_HERMES
#import <ABI46_0_0Reacthermes/HermesExecutorFactory.h>
#else
#import <ABI46_0_0React/ABI46_0_0JSCExecutorFactory.h>
#endif

#import <ABI46_0_0ReactCommon/ABI46_0_0RCTTurboModuleManager.h>
#endif

ABI46_0_0RCT_EXTERN_C_BEGIN

void ABI46_0_0RCTAppSetupPrepareApp(UIApplication *application);
UIView *ABI46_0_0RCTAppSetupDefaultRootView(ABI46_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties);

ABI46_0_0RCT_EXTERN_C_END

#if ABI46_0_0RCT_NEW_ARCH_ENABLED
ABI46_0_0RCT_EXTERN id<ABI46_0_0RCTTurboModule> ABI46_0_0RCTAppSetupDefaultModuleFromClass(Class moduleClass);

std::unique_ptr<ABI46_0_0facebook::ABI46_0_0React::JSExecutorFactory> ABI46_0_0RCTAppSetupDefaultJsExecutorFactory(
    ABI46_0_0RCTBridge *bridge,
    ABI46_0_0RCTTurboModuleManager *turboModuleManager);
#endif
