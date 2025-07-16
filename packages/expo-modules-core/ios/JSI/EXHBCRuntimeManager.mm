// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXHBCRuntimeManager.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/Swift.h>

#ifdef USE_HERMES
#import <hermes/hermes.h>
#import <jsi/jsi.h>
#endif

namespace jsi = facebook::jsi;

@implementation EXHBCRuntimeManager

+ (BOOL)injectHermesBytecode:(nonnull NSData *)bytecode runtime:(nonnull EXRuntime *)runtime
{
#ifdef USE_HERMES
  @try {
    jsi::Runtime *jsiRuntime = [runtime get];
    
    if (!jsiRuntime) {
      NSLog(@"EXHBCRuntimeManager: JSI Runtime is null");
      return NO;
    }
    
    // Check if we're actually running on Hermes
    if (![self isHermesBytecodeSupported:runtime]) {
      NSLog(@"EXHBCRuntimeManager: Hermes bytecode not supported on this runtime");
      return NO;
    }
    
    // Convert NSData to StringBuffer for JavaScript evaluation
    // Use the same approach as your builtins example
    auto buffer = std::make_shared<facebook::jsi::StringBuffer>(
      std::string((const char*)bytecode.bytes, bytecode.length)
    );
    
    // Execute the bytecode using standard JSI runtime
    // This works for both Hermes bytecode and regular JavaScript
    jsiRuntime->evaluateJavaScript(buffer, "bundle.hbc");
    NSLog(@"EXHBCRuntimeManager: Successfully executed Hermes bytecode (%lu bytes)", (unsigned long)bytecode.length);
    return YES;
  }
  @catch (NSException *exception) {
    NSLog(@"EXHBCRuntimeManager: Exception during HBC injection: %@", exception.reason);
    return NO;
  }
#else
  NSLog(@"EXHBCRuntimeManager: Hermes not enabled, cannot inject HBC");
  return NO;
#endif
}

+ (BOOL)isHermesBytecodeSupported:(nonnull EXRuntime *)runtime
{
#ifdef USE_HERMES
  jsi::Runtime *jsiRuntime = [runtime get];
  if (!jsiRuntime) {
    return NO;
  }
  
  // Check if the runtime is a Hermes runtime
  auto hermesRuntime = dynamic_cast<facebook::hermes::HermesRuntime*>(jsiRuntime);
  return hermesRuntime != nullptr;
#else
  return NO;
#endif
}

@end
