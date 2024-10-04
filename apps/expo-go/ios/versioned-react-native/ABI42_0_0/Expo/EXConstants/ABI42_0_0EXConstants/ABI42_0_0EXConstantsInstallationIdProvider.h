// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXConstantsInstallationIdProvider : NSObject

- (nullable NSString *)getInstallationId;
- (NSString *)getOrCreateInstallationId;

@end

NS_ASSUME_NONNULL_END
