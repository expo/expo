// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXNotifications/EXScoper.h>
#import <UMCore/UMInternalModule.h>
#import <EXNotifications/EXBareScoper.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedScoper : EXBareScoper <UMInternalModule, EXScoper>

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
