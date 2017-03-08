// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScope.h"
#import "EXVersionManager.h"
#import "EXFileSystem.h"
#import <React/RCTAssert.h>

@implementation EXScope

+ (NSString *)moduleName { return @"ExponentScope"; }

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
    NSDictionary *manifest = params[@"manifest"];
    RCTAssert(manifest, @"Need manifest to get experience id.");
    _experienceId = manifest[@"id"];

    NSString *subdir = [EXVersionManager escapedResourceName:_experienceId];
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

  if (![EXFileSystem ensureDirExistsWithPath:prefix]) {
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

@implementation  RCTBridge (EXScope)

- (EXScope *)experienceScope
{
  return [self moduleForClass:[EXScope class]];
}

@end
