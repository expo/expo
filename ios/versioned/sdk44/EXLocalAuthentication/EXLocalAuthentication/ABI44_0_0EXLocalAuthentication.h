// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

@interface ABI44_0_0EXLocalAuthentication : ABI44_0_0EXExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI44_0_0EXPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
