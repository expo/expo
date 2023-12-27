// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiUtil.h"

#import <CommonCrypto/CommonDigest.h>
#import <React/RCTUtils.h>

@import EXManifests;

NS_ASSUME_NONNULL_BEGIN

static NSString* kPublicKeyTag = @"exp.host.publickey";

@implementation EXApiUtil

+ (NSURL *)bundleUrlFromManifest:(EXManifestsManifest *)manifest
{
  return [[self class] encodedUrlFromString:manifest.bundleUrl];
}

+ (NSURL *)encodedUrlFromString:(NSString *)urlString
{
  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    url = [NSURL URLWithString:[urlString stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]]];
  }
  return url;
}

@end

NS_ASSUME_NONNULL_END
