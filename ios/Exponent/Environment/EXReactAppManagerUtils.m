// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevMenuViewController.h"
#import "EXFrame.h"
#import "EXKernel.h"
#import "EXReactAppManager.h"
#import "EXReactAppManagerUtils.h"
#import "EXVersions.h"
#import "EXShellManager.h"

@interface EXReactAppManagerUtils ()

@property (nonatomic, strong) NSString *versionSymbolPrefix;
@property (nonatomic, strong) NSString *validatedVersion; // redeclare

@property (nonatomic, weak) EXReactAppManager *appManager;

@end

@implementation EXReactAppManagerUtils

- (instancetype)initWithAppManager:(EXReactAppManager *)appManager
{
  if (self = [super init]) {
    _appManager = appManager;
    _versionSymbolPrefix = @"";
    _validatedVersion = nil;
    [self _computeVersionSymbolPrefix];
  }
  return self;
}

- (Class)versionedClassFromString: (NSString *)classString
{
  return NSClassFromString([self versionedString:classString]);
}

- (NSString *)versionedString: (NSString *)string
{
  return [EXVersions versionedString:string withPrefix:_versionSymbolPrefix];
}

- (NSString *)computedApplicationKey
{
  if (_appManager.isKernel) {
    return @"ExponentApp";
  } else if (_appManager.frame) {
    NSDictionary *manifest = _appManager.frame.manifest;
    if (manifest && manifest[@"appKey"]) {
      return manifest[@"appKey"];
    }
    
    if (_appManager.frame.source) {
      NSURLComponents *components = [NSURLComponents componentsWithURL:_appManager.frame.source resolvingAgainstBaseURL:YES];
      NSArray<NSURLQueryItem *> *queryItems = components.queryItems;
      for (NSURLQueryItem *item in queryItems) {
        if ([item.name isEqualToString:@"app"]) {
          return item.value;
        }
      }
    }
  }
  
  return @"main";
}

- (NSDictionary *)initialProperties
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  NSMutableDictionary *expProps = [NSMutableDictionary dictionary];

  if (_appManager.frame && _appManager.frame.initialProps) {
    [expProps addEntriesFromDictionary:_appManager.frame.initialProps];
  }
  if (_appManager.isKernel) {
    if ([EXShellManager sharedInstance].isShell) {
      [props addEntriesFromDictionary:@{
                                        @"shell": @YES,
                                        @"shellManifestUrl": [EXShellManager sharedInstance].shellManifestUrl,
                                        }];
    }
  }

  props[@"exp"] = expProps;

  return props;
}

- (BOOL)doesManifestEnableDeveloperTools
{
  NSDictionary *manifest = _appManager.frame.manifest;
  if (manifest) {
    NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
    BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
    return (isDeployedFromTool);
  }
  return false;
}

- (EXCachedResourceBehavior)cacheBehaviorForJSResource
{
  EXCachedResourceBehavior cacheBehavior;
  if (_appManager.isKernel) {
    cacheBehavior = [[NSUserDefaults standardUserDefaults] boolForKey:kEXSkipCacheUserDefaultsKey] ?
    kEXCachedResourceNoCache :
    kEXCachedResourceUseCacheImmediately;
  } else {
    cacheBehavior = ([self doesManifestEnableDeveloperTools]) ? kEXCachedResourceNoCache : kEXCachedResourceFallBackToCache;
  }
  return cacheBehavior;
}

- (NSString *)bundleNameForJSResource
{
  NSString *bundleName;
  if (_appManager.isKernel) {
    bundleName = kEXKernelBundleResourceName;
  } else {
    if (_appManager.frame.initialProps && [_appManager.frame.initialProps[@"shell"] boolValue]) {
      bundleName = kEXShellBundleResourceName;
      NSLog(@"EXAppManager: Standalone bundle remote url is %@", [_appManager.reactBridge bundleURL]);
    } else {
      bundleName = _appManager.frame.manifest[@"id"];
    }
  }
  return bundleName;
}

#pragma mark - internal

- (void)_computeVersionSymbolPrefix
{
  if (_appManager.isKernel) {
    _versionSymbolPrefix = @"";
    _validatedVersion = @"";
  } else {
    _versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForManifest:_appManager.frame.manifest];
    _validatedVersion = [[EXVersions sharedInstance] versionForManifest:_appManager.frame.manifest];
  }
}

@end
