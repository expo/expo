// Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXSecureStore/EXSecureStore.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedSecureStore : EXSecureStore

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
