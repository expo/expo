/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootView.h>

#ifdef __cplusplus

#import <memory>

#ifndef ABI49_0_0RCT_USE_HERMES
#if __has_include(<ABI49_0_0Reacthermes/HermesExecutorFactory.h>)
#define ABI49_0_0RCT_USE_HERMES 1
#else
#define ABI49_0_0RCT_USE_HERMES 0
#endif
#endif

#if ABI49_0_0RCT_USE_HERMES
#import <ABI49_0_0Reacthermes/HermesExecutorFactory.h>
#else
#import <ABI49_0_0React/ABI49_0_0JSCExecutorFactory.h>
#endif

#if ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0ReactCommon/ABI49_0_0RCTTurboModuleManager.h>
#endif

// Forward declaration to decrease compilation coupling
namespace ABI49_0_0facebook::ABI49_0_0React {
class RuntimeScheduler;
}

#if ABI49_0_0RCT_NEW_ARCH_ENABLED
ABI49_0_0RCT_EXTERN id<ABI49_0_0RCTTurboModule> ABI49_0_0RCTAppSetupDefaultModuleFromClass(Class moduleClass);

std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory> ABI49_0_0RCTAppSetupDefaultJsExecutorFactory(
    ABI49_0_0RCTBridge *bridge,
    ABI49_0_0RCTTurboModuleManager *turboModuleManager,
    std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::RuntimeScheduler> const &runtimeScheduler);

#else
std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory> ABI49_0_0RCTAppSetupJsExecutorFactoryForOldArch(
    ABI49_0_0RCTBridge *bridge,
    std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::RuntimeScheduler> const &runtimeScheduler);
#endif

#endif // __cplusplus

ABI49_0_0RCT_EXTERN_C_BEGIN

void ABI49_0_0RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled);
UIView *ABI49_0_0RCTAppSetupDefaultRootView(
    ABI49_0_0RCTBridge *bridge,
    NSString *moduleName,
    NSDictionary *initialProperties,
    BOOL fabricEnabled);

ABI49_0_0RCT_EXTERN_C_END
