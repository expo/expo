// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXServerRegistrationModule : ABI41_0_0UMExportedModule

- (NSString *)getInstallationId;

- (void)getRegistrationInfoAsyncWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject;
- (void)setRegistrationInfoAsync:(NSString *)registrationInfo
                        resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                        rejecter:(ABI41_0_0UMPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
