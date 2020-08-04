/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTTurboModule.h"

@protocol ABI38_0_0RCTTurboModuleManagerDelegate <NSObject>

// TODO: Move to xplat codegen.
- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                       instance:(id<ABI38_0_0RCTTurboModule>)instance
                                                      jsInvoker:
                                                          (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker;

@optional

/**
 * Given a module name, return its actual class. If not provided, basic ObjC class lookup is performed.
 */
- (Class)getModuleClassFromName:(const char *)name;

/**
 * Given a module class, provide an instance for it. If not provided, default initializer is used.
 */
- (id<ABI38_0_0RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass;

/**
 * Create an instance of a TurboModule without relying on any ObjC++ module instance.
 */
- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:
                                                          (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker;

@end

@interface ABI38_0_0RCTTurboModuleManager : NSObject <ABI38_0_0RCTTurboModuleLookupDelegate>

- (instancetype)initWithBridge:(ABI38_0_0RCTBridge *)bridge delegate:(id<ABI38_0_0RCTTurboModuleManagerDelegate>)delegate;

- (void)installJSBindingWithRuntime:(ABI38_0_0facebook::jsi::Runtime *)runtime;

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getModule:(const std::string &)name;

- (void)invalidate;

@end
