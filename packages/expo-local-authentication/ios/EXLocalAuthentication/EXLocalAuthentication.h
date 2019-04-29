// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@interface EXLocalAuthentication : UMExportedModule

- (void)authenticateAsync:(NSString *)reason
                  resolve:(UMPromiseResolveBlock)resolve
                   reject:(UMPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
