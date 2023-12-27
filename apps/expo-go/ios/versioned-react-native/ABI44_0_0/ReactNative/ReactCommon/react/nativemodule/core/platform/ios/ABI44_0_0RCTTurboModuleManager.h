/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import "ABI44_0_0RCTTurboModule.h"

#import <ABI44_0_0ReactCommon/ABI44_0_0RuntimeExecutor.h>

@protocol ABI44_0_0RCTTurboModuleManagerDelegate <NSObject>

// TODO: Move to xplat codegen.
- (std::shared_ptr<ABI44_0_0facebook::ABI44_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const ABI44_0_0facebook::ABI44_0_0React::ObjCTurboModule::InitParams &)params;
@optional
- (NSArray<NSString *> *)getEagerInitModuleNames;
- (NSArray<NSString *> *)getEagerInitMainQueueModuleNames;

@optional

/**
 * Given a module name, return its actual class. If not provided, basic ObjC class lookup is performed.
 */
- (Class)getModuleClassFromName:(const char *)name;

/**
 * Given a module class, provide an instance for it. If not provided, default initializer is used.
 */
- (id<ABI44_0_0RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass;

/**
 * Create an instance of a TurboModule without relying on any ObjC++ module instance.
 */
- (std::shared_ptr<ABI44_0_0facebook::ABI44_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:
                                                          (std::shared_ptr<ABI44_0_0facebook::ABI44_0_0React::CallInvoker>)jsInvoker;

@end

@interface ABI44_0_0RCTTurboModuleManager : NSObject <ABI44_0_0RCTTurboModuleRegistry>

- (instancetype)initWithBridge:(ABI44_0_0RCTBridge *)bridge
                      delegate:(id<ABI44_0_0RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<ABI44_0_0facebook::ABI44_0_0React::CallInvoker>)jsInvoker;

- (void)installJSBindingWithRuntimeExecutor:(ABI44_0_0facebook::ABI44_0_0React::RuntimeExecutor)runtimeExecutor;

- (void)invalidate;

@end
