// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

@interface ABI33_0_0EXLocalAuthentication : ABI33_0_0UMExportedModule

- (void)authenticateAsync:(NSString *)reason
                  resolve:(ABI33_0_0UMPromiseResolveBlock)resolve
                   reject:(ABI33_0_0UMPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
