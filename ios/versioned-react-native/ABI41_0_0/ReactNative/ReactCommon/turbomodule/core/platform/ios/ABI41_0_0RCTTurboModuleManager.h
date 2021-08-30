/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTTurboModule.h"

@protocol ABI41_0_0RCTTurboModuleManagerDelegate <NSObject>

// TODO: Move to xplat codegen.
- (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                       instance:(id<ABI41_0_0RCTTurboModule>)instance
                                                      jsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
                                                  nativeInvoker:
                                                      (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)nativeInvoker
                                                     perfLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)perfLogger;

@optional

/**
 * Given a module name, return its actual class. If not provided, basic ObjC class lookup is performed.
 */
- (Class)getModuleClassFromName:(const char *)name;

/**
 * Given a module class, provide an instance for it. If not provided, default initializer is used.
 */
- (id<ABI41_0_0RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass;

/**
 * Create an instance of a TurboModule without relying on any ObjC++ module instance.
 */
- (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:
                                                          (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker;

@end

@interface ABI41_0_0RCTTurboModuleManager : NSObject <ABI41_0_0RCTTurboModuleLookupDelegate>

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge
                      delegate:(id<ABI41_0_0RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker;

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge
                      delegate:(id<ABI41_0_0RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
             performanceLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)performanceLogger;

- (void)installJSBindingWithRuntime:(ABI41_0_0facebook::jsi::Runtime *)runtime;

- (void)invalidate;

@end
