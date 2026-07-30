// Copyright 2026-present 650 Industries. All rights reserved.

#import <Expo/EXBundleConfiguration.h>

#if TARGET_OS_IOS || TARGET_OS_TV

@implementation EXBundleConfiguration {
  NSURL *_bundleURL;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
{
  if (bundleURL.fileURL) {
    self = [super initWithBundleFilePath:bundleURL];
  } else {
    self = [super init];
  }
  if (self) {
    _bundleURL = bundleURL;
  }
  return self;
}

- (NSURL *)getBundleURL
{
  return _bundleURL;
}

- (NSString *)getPackagerServerScheme
{
  if (_bundleURL.fileURL) {
    return [super getPackagerServerScheme];
  }

  NSString *scheme = _bundleURL.scheme;
  if ([scheme isEqualToString:@"https"] || [scheme isEqualToString:@"exps"]) {
    return @"https";
  } else if ([scheme isEqualToString:@"http"] || [scheme isEqualToString:@"exp"]) {
    return @"http";
  } else {
    return [super getPackagerServerScheme];
  }
}

- (NSString *)getPackagerServerHost
{
  if (_bundleURL.fileURL) {
    return [super getPackagerServerHost];
  }

  NSString *host = _bundleURL.host;
  if (host == nil) {
    return [super getPackagerServerHost];
  }

  NSNumber *port = _bundleURL.port;
  if (port == nil) {
    return host;
  } else if ([host containsString:@":"] && ![host hasPrefix:@"["]) {
    return [NSString stringWithFormat:@"[%@]:%@", host, port];
  } else {
    return [NSString stringWithFormat:@"%@:%@", host, port];
  }
}

+ (RCTBundleConfiguration *)configurationWithBundleURL:(nullable NSURL *)bundleURL
{
  if (bundleURL == nil) {
    return [RCTBundleConfiguration defaultConfiguration];
  } else {
    return [[EXBundleConfiguration alloc] initWithBundleURL:bundleURL];
  }
}

@end

#endif
