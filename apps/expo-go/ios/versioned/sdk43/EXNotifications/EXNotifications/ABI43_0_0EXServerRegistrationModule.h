// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXServerRegistrationModule : ABI43_0_0EXExportedModule

- (NSString *)getInstallationId;

- (void)getRegistrationInfoAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;
- (void)setRegistrationInfoAsync:(NSString *)registrationInfo
                        resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                        rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
