// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface AppMetricsVersions : NSObject

@property (class, readonly, nonnull) NSString *reactNativeVersion;
@property (class, readonly, nonnull) NSString *expoSdkVersion;
@property (class, readonly, nonnull) NSString *clientVersion;
@property (class, readonly, nullable) NSString *easBuildId;

@end
