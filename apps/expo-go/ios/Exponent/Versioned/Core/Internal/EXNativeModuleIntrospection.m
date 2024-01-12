// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXNativeModuleIntrospection.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeMethod.h>
#import <React/RCTModuleData.h>

@implementation EXNativeModuleIntrospection

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExpoNativeModuleIntrospection)

RCT_REMAP_METHOD(getNativeModuleNamesAsync,
                 nativeModuleNamesWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSError *error;
  NSDictionary<NSString *, RCTModuleData *> *moduleDataByName = [self _moduleDataFromBridge:&error];
  if (!moduleDataByName) {
    reject(error.domain, error.userInfo[NSLocalizedDescriptionKey], error);
    return;
  }

  NSArray<NSString *> *moduleNames = moduleDataByName.allKeys;
  resolve(moduleNames);
}

RCT_REMAP_METHOD(introspectNativeModuleAsync,
                 introspectNativeModule:(NSString *)name
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSError *error;
  NSDictionary<NSString *, RCTModuleData *> *moduleDataByName = [self _moduleDataFromBridge:&error];
  if (!moduleDataByName) {
    reject(error.domain, error.userInfo[NSLocalizedDescriptionKey], error);
    return;
  }
  
  RCTModuleData *moduleData = moduleDataByName[name];
  if (!moduleData) {
    resolve(nil);
    return;
  }
  
  NSArray<id<RCTBridgeMethod>> *moduleMethods = moduleData.methods;
  NSMutableDictionary<NSString *, NSDictionary<NSString *, id> *> *methodDescriptions = [NSMutableDictionary dictionaryWithCapacity:moduleMethods.count];
  for (id<RCTBridgeMethod> method in moduleMethods) {
    NSString *methodName = [NSString stringWithCString:method.JSMethodName encoding:NSASCIIStringEncoding];
    NSString *functionType = [NSString stringWithCString:RCTFunctionDescriptorFromType(method.functionType)
                                                encoding:NSASCIIStringEncoding];
    methodDescriptions[methodName] = @{ @"type": functionType };
  }

  resolve(@{ @"methods": methodDescriptions });
}

- (NSDictionary<NSString *, RCTModuleData *> *)_moduleDataFromBridge:(NSError **)error {
  RCTBridge *bridge = _bridge;
  if (![NSStringFromClass(bridge.class) isEqualToString:@"RCTCxxBridge"]) {
    if (error) {
      *error = [NSError errorWithDomain:@"E_NATIVEMODULEINTROSPECTION_INCOMPATIBLE_BRIDGE" code:0 userInfo:@{
         NSLocalizedDescriptionKey: @"Native module introspection is compatible only with the C++ bridge",
      }];
    }
    return nil;
  }
  
  NSDictionary<NSString *, RCTModuleData *> *moduleDataByName;
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

