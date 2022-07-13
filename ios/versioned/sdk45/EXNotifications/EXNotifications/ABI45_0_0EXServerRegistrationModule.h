// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXServerRegistrationModule : ABI45_0_0EXExportedModule

- (NSString *)getInstallationId;

- (void)getRegistrationInfoAsyncWithResolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;
- (void)setRegistrationInfoAsync:(NSString *)registrationInfo
                        resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                        rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
