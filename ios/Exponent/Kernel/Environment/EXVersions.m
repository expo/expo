// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConstants.h"
#import "EXVersions.h"
#import "EXKernelUtil.h"

@interface EXVersions ()

- (void)_loadVersions;

@end

@implementation NSString (EXVersions)

- (NSArray <NSNumber *>*)versionComponents
{
  NSArray *stringComponents = [self componentsSeparatedByString:@"."];
  NSMutableArray <NSNumber *>* components = [NSMutableArray arrayWithCapacity:stringComponents.count];
  for (NSString *component in stringComponents) {
    [components addObject:@([component integerValue])];
  }
  return components;
}

@end

@implementation EXVersions

+ (nonnull instancetype)sharedInstance
{
  static EXVersions *theVersions;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theVersions) {
      theVersions = [[EXVersions alloc] init];
    }
  });
  return theVersions;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self _loadVersions];
  }
  return self;
}

+ (NSString *)versionedString:(NSString *)string withPrefix:(NSString *)symbolPrefix
{
  if (!string || !symbolPrefix) {
    return nil;
  }
  return [NSString stringWithFormat:@"%@%@", symbolPrefix, string];
}

- (NSString *)symbolPrefixForSdkVersion:(NSString *)version isKernel:(BOOL)isKernel
{
  NSDictionary *detachedVersions = _versions[@"detachedNativeVersions"];
  if (detachedVersions) {
    if (!isKernel && detachedVersions[@"shell"]) {
      // we are in a detached shell scenario, so we always want to leave the shell unprefixed
      return @"";
    }
    if (isKernel && detachedVersions[@"shell"] && detachedVersions[@"kernel"]) {
      if ([detachedVersions[@"shell"] isEqualToString:detachedVersions[@"kernel"]]) {
        // kernel version matches shell version, so run them both unprefixed
        return @"";
      } else {
        // kernel needs to run on prefixed code for the given kernel version, continue
        version = detachedVersions[@"kernel"];
      }
    }
  }
  if (version && version.length) {
    return [[@"ABI" stringByAppendingString:version] stringByReplacingOccurrencesOfString:@"." withString:@"_"];
  }
  return @"";
}

- (NSString *)availableSdkVersionForManifest: (NSDictionary * _Nullable)manifest
{
  return [self _versionForManifest:manifest];
}

#pragma mark - Internal

- (NSString *)_versionForManifest:(NSDictionary * _Nullable)manifest
{
  if (manifest && manifest[@"sdkVersion"]) {
    NSString *sdkVersion = manifest[@"sdkVersion"];
    NSArray *sdkVersions = _versions[@"sdkVersions"];
    if (sdkVersion && sdkVersions) {
      for (NSString *availableVersion in sdkVersions) {
        if ([sdkVersion isEqualToString:availableVersion]) {
          if (_temporarySdkVersion) {
            NSArray <NSNumber *>* versionComponents = [availableVersion versionComponents];
            BOOL isTemporary = (versionComponents.count > 1 && versionComponents[1].integerValue != 0);
            if (isTemporary && [availableVersion isEqualToString:_temporarySdkVersion]) {
              // no prefix if we're just using the current version
              break;
            }
          }
          return availableVersion;
        }
      }
    }
  }
  return @"";
}

- (void)_loadVersions
{
  NSString *versionsPath = [[NSBundle mainBundle] pathForResource:@"EXSDKVersions" ofType:@"plist"];
  NSMutableDictionary *mutableVersions = (versionsPath) ? [NSMutableDictionary dictionaryWithContentsOfFile:versionsPath] : [NSMutableDictionary dictionary];
  if (mutableVersions[@"detachedNativeVersions"]) {
    NSDictionary *detachedNativeVersions = mutableVersions[@"detachedNativeVersions"];
    _temporarySdkVersion = detachedNativeVersions[@"shell"];
  } else {
    _temporarySdkVersion = [EXBuildConstants sharedInstance].temporarySdkVersion;
  }
  if (_temporarySdkVersion) {
    if (mutableVersions[@"sdkVersions"]) {
      NSArray *existingVersions = mutableVersions[@"sdkVersions"];
      if ([existingVersions indexOfObject:_temporarySdkVersion] == NSNotFound) {
        mutableVersions[@"sdkVersions"] = [[existingVersions mutableCopy] arrayByAddingObject:_temporarySdkVersion];
      }
    }
  } else {
    // no temporary sdk version specified in any way, fall back to using the highest version
    NSArray *sdkVersions = mutableVersions[@"sdkVersions"];
    NSUInteger highestVersion = 0;
    if (sdkVersions) {
      for (NSString *availableVersion in sdkVersions) {
        NSArray <NSNumber *>* versionComponents = [availableVersion versionComponents];
        if (versionComponents.count > 1 && versionComponents[0].integerValue > highestVersion) {
          highestVersion = versionComponents[0].integerValue;
          _temporarySdkVersion = availableVersion;
        }
      }
    }
  }

  NSAssert((mutableVersions[@"sdkVersions"] != nil), @"No SDK versions are specified for the Expo kernel. Is the project missing EXSDKVersions.plist?");

  _versions = mutableVersions;
}

@end
