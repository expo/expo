// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXNotifications/EXAppIdProvider.h>
#import <UMCore/UMInternalModule.h>
#import <EXNotifications/EXBareAppIdProvider.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedAppIdProvider : EXBareAppIdProvider <UMInternalModule, EXAppIdProvider>

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
