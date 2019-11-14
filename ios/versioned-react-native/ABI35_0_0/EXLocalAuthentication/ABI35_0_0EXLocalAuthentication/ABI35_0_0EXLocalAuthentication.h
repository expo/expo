// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

@interface ABI35_0_0EXLocalAuthentication : ABI35_0_0UMExportedModule

- (void)authenticateWithOptions:(NSDictionary *)options
                        resolve:(ABI35_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI35_0_0UMPromiseRejectBlock)reject;
- (NSString *)convertErrorCode:(NSError *)error;
+ (BOOL)isTouchIdDevice;
+ (BOOL)isFaceIdDevice;

@end
