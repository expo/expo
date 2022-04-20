// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

@interface ABI45_0_0EXLocalAuthentication : ABI45_0_0EXExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI45_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI45_0_0EXPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
