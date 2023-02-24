/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTRootView.h>

#ifdef __cplusplus

#if ABI48_0_0RCT_NEW_ARCH_ENABLED

#ifndef ABI48_0_0RCT_USE_HERMES
#if __has_include(<ABI48_0_0Reacthermes/HermesExecutorFactory.h>)
#define ABI48_0_0RCT_USE_HERMES 1
#else
#define ABI48_0_0RCT_USE_HERMES 0
#endif
#endif

#if ABI48_0_0RCT_USE_HERMES
#import <ABI48_0_0Reacthermes/HermesExecutorFactory.h>
#else
#import <ABI48_0_0React/ABI48_0_0JSCExecutorFactory.h>
#endif

#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModuleManager.h>
#endif

#if ABI48_0_0RCT_NEW_ARCH_ENABLED
ABI48_0_0RCT_EXTERN id<ABI48_0_0RCTTurboModule> ABI48_0_0RCTAppSetupDefaultModuleFromClass(Class moduleClass);

std::unique_ptr<ABI48_0_0facebook::ABI48_0_0React::JSExecutorFactory> ABI48_0_0RCTAppSetupDefaultJsExecutorFactory(
    ABI48_0_0RCTBridge *bridge,
    ABI48_0_0RCTTurboModuleManager *turboModuleManager);
#endif

#endif // __cplusplus

ABI48_0_0RCT_EXTERN_C_BEGIN

void ABI48_0_0RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled);
UIView *ABI48_0_0RCTAppSetupDefaultRootView(
    ABI48_0_0RCTBridge *bridge,
    NSString *moduleName,
    NSDictionary *initialProperties,
    BOOL fabricEnabled);

ABI48_0_0RCT_EXTERN_C_END
