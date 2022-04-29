// Copyright 2015-present 650 Industries. All rights reserved.

#import "DevMenuRCTDevSettings.h"

@implementation DevMenuRCTDevSettings

+ (NSString *)moduleName
{
  return @"DevSettings";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

- (BOOL)isHotLoadingAvailable
{
  return NO;
}

- (BOOL)isRemoteDebuggingAvailable
{
  return NO;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (id)settingForKey:(NSString *)key
{
  return nil;
}

- (void)reload {}

- (void)reloadWithReason:(NSString *)reason {}

- (void)onFastRefresh {}

- (void)setHotLoadingEnabled:(BOOL)isHotLoadingEnabled {}

- (void)setIsDebuggingRemotely:(BOOL)isDebuggingRemotelyEnabled {}

- (void)setProfilingEnabled:(BOOL)isProfilingEnabled {}

- (void)toggleElementInspector {}

- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL {}

- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL {}

- (void)addMenuItem:(NSString *)title {}

- (void)setIsShakeToShowDevMenuEnabled:(BOOL)enabled {}

@end
