// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXServerRegistrationModule : ABI44_0_0EXExportedModule

- (NSString *)getInstallationId;

- (void)getRegistrationInfoAsyncWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;
- (void)setRegistrationInfoAsync:(NSString *)registrationInfo
                        resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                        rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
