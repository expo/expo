// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Swift classes need forward-declaration in the headers.
@class EXRuntime;

/**
 * Manager for handling Hermes Bytecode (HBC) injection into JavaScript runtimes.
 */
@interface EXHBCRuntimeManager : NSObject

/**
 * Injects Hermes bytecode into the given runtime.
 * This method should be called during runtime initialization, before any user code is executed.
 *
 * @param bytecode The HBC data to inject
 * @param runtime The Expo runtime to inject into
 * @return YES if injection was successful, NO otherwise
 */
+ (BOOL)injectHermesBytecode:(nonnull NSData *)bytecode runtime:(nonnull EXRuntime *)runtime;

/**
 * Checks if the current runtime supports Hermes bytecode execution.
 * This returns YES if using Hermes engine, NO if using JSC.
 *
 * @param runtime The runtime to check
 * @return YES if HBC is supported, NO otherwise
 */
+ (BOOL)isHermesBytecodeSupported:(nonnull EXRuntime *)runtime;

@end