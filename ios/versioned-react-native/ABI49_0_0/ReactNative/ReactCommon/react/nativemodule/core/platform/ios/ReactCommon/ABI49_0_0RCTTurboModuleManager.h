/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>
#import <ABI49_0_0React/ABI49_0_0RCTTurboModuleRegistry.h>
#import <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#import <ABI49_0_0ReactCommon/ABI49_0_0TurboModuleBinding.h>
#import "ABI49_0_0RCTTurboModule.h"

ABI49_0_0RCT_EXTERN void ABI49_0_0RCTTurboModuleSetBindingMode(ABI49_0_0facebook::ABI49_0_0React::TurboModuleBindingMode bindingMode);

@protocol ABI49_0_0RCTTurboModuleManagerDelegate <NSObject>

@optional
- (NSArray<NSString *> *)getEagerInitModuleNames;
- (NSArray<NSString *> *)getEagerInitMainQueueModuleNames;

/**
 * Given a module name, return its actual class. If not provided, basic ObjC class lookup is performed.
 */
- (Class)getModuleClassFromName:(const char *)name;

/**
 * Given a module class, provide an instance for it. If not provided, default initializer is used.
 */
- (id<ABI49_0_0RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass;

/**
 * Create an instance of a TurboModule without relying on any ObjC++ module instance.
 */
- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:
                                                          (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker>)jsInvoker;

@end

@interface ABI49_0_0RCTTurboModuleManager : NSObject <ABI49_0_0RCTTurboModuleRegistry>

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
                      delegate:(id<ABI49_0_0RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker>)jsInvoker;

- (void)installJSBindingWithRuntimeExecutor:(ABI49_0_0facebook::ABI49_0_0React::RuntimeExecutor &)runtimeExecutor;

- (void)invalidate;

@end
