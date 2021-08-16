// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXServerRegistrationModule : EXExportedModule

- (NSString *)getInstallationId;

- (void)getRegistrationInfoAsyncWithResolver:(EXPromiseResolveBlock)resolve
                                    rejecter:(EXPromiseRejectBlock)reject;
- (void)setRegistrationInfoAsync:(NSString *)registrationInfo
                        resolver:(EXPromiseResolveBlock)resolve
                        rejecter:(EXPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
