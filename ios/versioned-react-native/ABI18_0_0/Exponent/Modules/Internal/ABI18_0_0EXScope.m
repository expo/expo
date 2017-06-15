// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXScope.h"
#import "ABI18_0_0EXVersionManager.h"
#import "ABI18_0_0EXFileSystem.h"
#import "ABI18_0_0EXUnversioned.h"

#import <ReactABI18_0_0/ABI18_0_0RCTAssert.h>

@implementation ABI18_0_0EXScope

+ (NSString *)moduleName { return @"ExponentScope"; }

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
    NSDictionary *manifest = params[@"manifest"];
    ABI18_0_0RCTAssert(manifest, @"Need manifest to get experience id.");
    _experienceId = manifest[@"id"];

    NSString *subdir = [ABI18_0_0EXVersionManager escapedResourceName:_experienceId];
    _documentDirectory = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
                           stringByAppendingPathComponent:@"ExponentExperienceData"]
                          stringByAppendingPathComponent:subdir];
    _cachesDirectory = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
                         stringByAppendingPathComponent:@"ExponentExperienceData"]
                        stringByAppendingPathComponent:subdir];

    _initialUri = params[@"initialUri"];
    if (params[@"constants"] && params[@"constants"][@"appOwnership"]) {
      _appOwnership = params[@"constants"][@"appOwnership"];
    }
  }
  return self;
}

- (NSString *)scopedPathWithPath:(NSString *)path withOptions:(NSDictionary *)options
{
  NSString *prefix = _documentDirectory;
  if ([options objectForKey:@"cache"] && [[options objectForKey:@"cache"] boolValue]) {
    prefix = _cachesDirectory;
  }

  if (![ABI18_0_0EXFileSystem ensureDirExistsWithPath:prefix]) {
    return nil;
  }

  NSString *scopedPath = [[NSString stringWithFormat:@"%@/%@", prefix, path] stringByStandardizingPath];
  if ([scopedPath hasPrefix:[prefix stringByStandardizingPath]]) {
    return scopedPath;
  } else {
    return nil;
  }
}

- (NSString *)apnsToken
{
  // TODO: this is a hack until we formalize kernelspace modules and provide real access to this.
  // at the moment it duplicates logic inside ABI18_0_0EXRemoteNotificationManager.
  NSData *apnsData = [[NSUserDefaults standardUserDefaults] objectForKey:@"EXCurrentAPNSTokenDefaultsKey"];
  if (apnsData) {
    NSCharacterSet *brackets = [NSCharacterSet characterSetWithCharactersInString:@"<>"];
    return [[[apnsData description] stringByTrimmingCharactersInSet:brackets] stringByReplacingOccurrencesOfString:@" " withString:@""];
  }
  return nil;
}

@end

@implementation  ABI18_0_0RCTBridge (ABI18_0_0EXScope)

- (ABI18_0_0EXScope *)experienceScope
{
  return [self moduleForClass:[ABI18_0_0EXScope class]];
}

@end
