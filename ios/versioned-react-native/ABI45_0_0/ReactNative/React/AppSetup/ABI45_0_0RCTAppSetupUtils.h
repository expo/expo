/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTRootView.h>

#if ABI45_0_0RCT_NEW_ARCH_ENABLED

#ifndef ABI45_0_0RCT_USE_HERMES
#if __has_include(<ABI45_0_0Reacthermes/HermesExecutorFactory.h>)
#define ABI45_0_0RCT_USE_HERMES 1
#else
#define ABI45_0_0RCT_USE_HERMES 0
#endif
#endif

#if ABI45_0_0RCT_USE_HERMES
#import <ABI45_0_0Reacthermes/HermesExecutorFactory.h>
#else
#import <ABI45_0_0React/ABI45_0_0JSCExecutorFactory.h>
#endif

#import <ABI45_0_0ReactCommon/ABI45_0_0RCTTurboModuleManager.h>
#endif

ABI45_0_0RCT_EXTERN_C_BEGIN

void ABI45_0_0RCTAppSetupPrepareApp(UIApplication *application);
UIView *ABI45_0_0RCTAppSetupDefaultRootView(ABI45_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties);

ABI45_0_0RCT_EXTERN_C_END

#if ABI45_0_0RCT_NEW_ARCH_ENABLED
ABI45_0_0RCT_EXTERN id<ABI45_0_0RCTTurboModule> ABI45_0_0RCTAppSetupDefaultModuleFromClass(Class moduleClass);

std::unique_ptr<ABI45_0_0facebook::ABI45_0_0React::JSExecutorFactory> ABI45_0_0RCTAppSetupDefaultJsExecutorFactory(
    ABI45_0_0RCTBridge *bridge,
    ABI45_0_0RCTTurboModuleManager *turboModuleManager);
#endif
