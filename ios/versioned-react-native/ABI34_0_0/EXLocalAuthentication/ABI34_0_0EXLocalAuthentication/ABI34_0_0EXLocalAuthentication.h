// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

@interface ABI34_0_0EXLocalAuthentication : ABI34_0_0UMExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI34_0_0UMPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
