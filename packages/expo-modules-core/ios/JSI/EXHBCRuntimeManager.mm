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
  jsi::Runtime *jsiRuntime = [runtime get];
  return [self injectJavaScriptCode:bytecode intoRuntime:(void *)jsiRuntime];
}

+ (BOOL)injectJavaScriptCode:(nonnull NSData *)code intoRuntime:(void *)runtime
{
  @try {
    if (!runtime) {
      NSLog(@"EXHBCRuntimeManager: JSI Runtime is null");
      return NO;
    }
    
    // Cast back to the JSI runtime type
    jsi::Runtime *jsiRuntime = static_cast<jsi::Runtime *>(runtime);
    
    // Convert NSData to StringBuffer for JavaScript evaluation
    // Use the same approach as the builtins example
    auto buffer = std::make_shared<facebook::jsi::StringBuffer>(
      std::string((const char*)code.bytes, code.length)
    );
    
    // Execute the bytecode using standard JSI runtime
    // This works for both Hermes bytecode and regular JavaScript
    jsiRuntime->evaluateJavaScript(buffer, "injected.js");
    NSLog(@"EXHBCRuntimeManager: Successfully executed JavaScript code (%lu bytes)", (unsigned long)code.length);
    return YES;
  }
  @catch (NSException *exception) {
    NSLog(@"EXHBCRuntimeManager: Exception during code injection: %@", exception.reason);
    return NO;
  }
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
