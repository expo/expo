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
 * Injects JavaScript code into the given JSI runtime.
 * This is used for both HBC files and debug scripts.
 * 
 * This is an internal method - use injectHermesBytecode:runtime: instead.
 *
 * @param code The JavaScript/HBC data to inject
 * @param runtime Pointer to the JSI runtime (void* to avoid C++ in header)
 * @return YES if injection was successful, NO otherwise
 */
+ (BOOL)injectJavaScriptCode:(nonnull NSData *)code intoRuntime:(void *)runtime;

/**
 * Checks if the current runtime supports Hermes bytecode execution.
 * This returns YES if using Hermes engine, NO if using JSC.
 *
 * @param runtime The runtime to check
 * @return YES if HBC is supported, NO otherwise
 */
+ (BOOL)isHermesBytecodeSupported:(nonnull EXRuntime *)runtime;

@end