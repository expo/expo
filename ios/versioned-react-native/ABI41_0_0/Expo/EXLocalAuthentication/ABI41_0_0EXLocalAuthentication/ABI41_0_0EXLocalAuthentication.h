// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

@interface ABI41_0_0EXLocalAuthentication : ABI41_0_0UMExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI41_0_0UMPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
