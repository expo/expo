// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI15_0_0EXScope.h"
#import "ABI15_0_0EXVersionManager.h"
#import "ABI15_0_0EXFileSystem.h"
#import <ReactABI15_0_0/ABI15_0_0RCTAssert.h>

@implementation ABI15_0_0EXScope

+ (NSString *)moduleName { return @"ExponentScope"; }

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
    NSDictionary *manifest = params[@"manifest"];
    ABI15_0_0RCTAssert(manifest, @"Need manifest to get experience id.");
    _experienceId = manifest[@"id"];

    NSString *subdir = [ABI15_0_0EXVersionManager escapedResourceName:_experienceId];
    _documentDirectory = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
                           stringByAppendingPathComponent:@"ExponentExperienceData"]
                          stringByAppendingPathComponent:subdir];
    _cachesDirectory = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
                         stringByAppendingPathComponent:@"ExponentExperienceData"]
                        stringByAppendingPathComponent:subdir];

    _initialUri = params[@"initialUri"];
  }
  return self;
}

- (NSString *)scopedPathWithPath:(NSString *)path withOptions:(NSDictionary *)options
{
  NSString *prefix = _documentDirectory;
  if ([options objectForKey:@"cache"] && [[options objectForKey:@"cache"] boolValue]) {
    prefix = _cachesDirectory;
  }

  if (![ABI15_0_0EXFileSystem ensureDirExistsWithPath:prefix]) {
    return nil;
  }

  NSString *scopedPath = [[NSString stringWithFormat:@"%@/%@", prefix, path] stringByStandardizingPath];
  if ([scopedPath hasPrefix:[prefix stringByStandardizingPath]]) {
    return scopedPath;
  } else {
    return nil;
  }
}

@end

@implementation  ABI15_0_0RCTBridge (ABI15_0_0EXScope)

- (ABI15_0_0EXScope *)experienceScope
{
  return [self moduleForClass:[ABI15_0_0EXScope class]];
}

@end
