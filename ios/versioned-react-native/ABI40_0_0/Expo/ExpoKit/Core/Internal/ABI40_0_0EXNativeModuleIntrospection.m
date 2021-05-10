// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXNativeModuleIntrospection.h"

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridgeMethod.h>
#import <ABI40_0_0React/ABI40_0_0RCTModuleData.h>

@implementation ABI40_0_0EXNativeModuleIntrospection

@synthesize bridge = _bridge;

ABI40_0_0RCT_EXPORT_MODULE(ExpoNativeModuleIntrospection)

ABI40_0_0RCT_REMAP_METHOD(getNativeModuleNamesAsync,
                 nativeModuleNamesWithResolver:(ABI40_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI40_0_0RCTPromiseRejectBlock)reject) {
  NSError *error;
  NSDictionary<NSString *, ABI40_0_0RCTModuleData *> *moduleDataByName = [self _moduleDataFromBridge:&error];
  if (!moduleDataByName) {
    reject(error.domain, error.userInfo[NSLocalizedDescriptionKey], error);
    return;
  }

  NSArray<NSString *> *moduleNames = moduleDataByName.allKeys;
  resolve(moduleNames);
}

ABI40_0_0RCT_REMAP_METHOD(introspectNativeModuleAsync,
                 introspectNativeModule:(NSString *)name
                 resolver:(ABI40_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI40_0_0RCTPromiseRejectBlock)reject) {
  NSError *error;
  NSDictionary<NSString *, ABI40_0_0RCTModuleData *> *moduleDataByName = [self _moduleDataFromBridge:&error];
  if (!moduleDataByName) {
    reject(error.domain, error.userInfo[NSLocalizedDescriptionKey], error);
    return;
  }
  
  ABI40_0_0RCTModuleData *moduleData = moduleDataByName[name];
  if (!moduleData) {
    resolve(nil);
    return;
  }
  
  NSArray<id<ABI40_0_0RCTBridgeMethod>> *moduleMethods = moduleData.methods;
  NSMutableDictionary<NSString *, NSDictionary<NSString *, id> *> *methodDescriptions = [NSMutableDictionary dictionaryWithCapacity:moduleMethods.count];
  for (id<ABI40_0_0RCTBridgeMethod> method in moduleMethods) {
    NSString *methodName = [NSString stringWithCString:method.JSMethodName encoding:NSASCIIStringEncoding];
    NSString *functionType = [NSString stringWithCString:ABI40_0_0RCTFunctionDescriptorFromType(method.functionType)
                                                encoding:NSASCIIStringEncoding];
    methodDescriptions[methodName] = @{ @"type": functionType };
  }

  resolve(@{ @"methods": methodDescriptions });
}

- (NSDictionary<NSString *, ABI40_0_0RCTModuleData *> *)_moduleDataFromBridge:(NSError **)error {
  ABI40_0_0RCTBridge *bridge = _bridge;
  if (![NSStringFromClass(bridge.class) isEqualToString:@"ABI40_0_0RCTCxxBridge"]) {
    if (error) {
      *error = [NSError errorWithDomain:@"E_NATIVEMODULEINTROSPECTION_INCOMPATIBLE_BRIDGE" code:0 userInfo:@{
         NSLocalizedDescriptionKey: @"Native module introspection is compatible only with the C++ bridge",
      }];
    }
    return nil;
  }
  
  NSDictionary<NSString *, ABI40_0_0RCTModuleData *> *moduleDataByName;
  @try {
    moduleDataByName = [bridge valueForKey:@"_moduleDataByName"];
  }
  @catch (NSException *e) {
    if (![e.name isEqualToString:NSUndefinedKeyException]) {
      @throw;
    }
    
    if (error) {
      NSString *variableName = e.userInfo[@"NSUnknownUserInfoKey"];
      *error = [NSError errorWithDomain:@"E_NATIVEMODULEINTROSPECTION_INCOMPATIBLE_BRIDGE" code:0 userInfo:@{
        NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Bridge does not define expected variable: %@", variableName],
      }];
    }
    return nil;
  }
  
  return moduleDataByName;
}

@end

