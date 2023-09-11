// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>

@interface ABI47_0_0EXLocalAuthentication : ABI47_0_0EXExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI47_0_0EXPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
