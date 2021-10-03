// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

@interface ABI43_0_0EXLocalAuthentication : ABI43_0_0EXExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI43_0_0EXPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
