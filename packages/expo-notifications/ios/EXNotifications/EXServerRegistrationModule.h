// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXServerRegistrationModule : UMExportedModule

- (NSString *)getInstallationId;

- (void)getRegistrationInfoAsyncWithResolver:(UMPromiseResolveBlock)resolve
                                    rejecter:(UMPromiseRejectBlock)reject;
- (void)setRegistrationInfoAsync:(NSString *)registrationInfo
                        resolver:(UMPromiseResolveBlock)resolve
                        rejecter:(UMPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
