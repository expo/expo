// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

@interface EXLocalAuthentication : EXExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(EXPromiseResolveBlock)resolve
                         reject:(EXPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
