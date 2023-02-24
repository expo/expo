/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootView.h>

#ifdef __cplusplus

#if ABI47_0_0RCT_NEW_ARCH_ENABLED

#ifndef ABI47_0_0RCT_USE_HERMES
#if __has_include(<ABI47_0_0Reacthermes/HermesExecutorFactory.h>)
#define ABI47_0_0RCT_USE_HERMES 1
#else
#define ABI47_0_0RCT_USE_HERMES 0
#endif
#endif

#if ABI47_0_0RCT_USE_HERMES
#import <ABI47_0_0Reacthermes/HermesExecutorFactory.h>
#else
#import <ABI47_0_0React/ABI47_0_0JSCExecutorFactory.h>
#endif

#import <ABI47_0_0ReactCommon/ABI47_0_0RCTTurboModuleManager.h>
#endif

#if ABI47_0_0RCT_NEW_ARCH_ENABLED
ABI47_0_0RCT_EXTERN id<ABI47_0_0RCTTurboModule> ABI47_0_0RCTAppSetupDefaultModuleFromClass(Class moduleClass);

std::unique_ptr<ABI47_0_0facebook::ABI47_0_0React::JSExecutorFactory> ABI47_0_0RCTAppSetupDefaultJsExecutorFactory(
    ABI47_0_0RCTBridge *bridge,
    ABI47_0_0RCTTurboModuleManager *turboModuleManager);
#endif

#endif // __cplusplus

ABI47_0_0RCT_EXTERN_C_BEGIN

void ABI47_0_0RCTAppSetupPrepareApp(UIApplication *application);
UIView *ABI47_0_0RCTAppSetupDefaultRootView(ABI47_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties);

ABI47_0_0RCT_EXTERN_C_END
