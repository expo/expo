// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

@interface ABI37_0_0EXLocalAuthentication : ABI37_0_0UMExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI37_0_0UMPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
