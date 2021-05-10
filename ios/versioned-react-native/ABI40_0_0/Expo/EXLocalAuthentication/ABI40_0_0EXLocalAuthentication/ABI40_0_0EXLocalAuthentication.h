// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

@interface ABI40_0_0EXLocalAuthentication : ABI40_0_0UMExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI40_0_0UMPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
